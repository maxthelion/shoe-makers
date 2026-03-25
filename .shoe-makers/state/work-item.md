# Implement partial work resumption (ContinueAgent)

skill-type: implement

## Wiki specification

From `wiki/pages/pure-function-agents.md` lines 53-57:

> An agent that runs for 4 minutes and produces partial work is fine. It writes what it has to the branch and exits with `status: partial`. Next tick, the [[behaviour-tree]] sees "unfinished work on the branch" and invokes `ContinueAgent` to pick up where the last agent left off.
>
> This eliminates timeouts and stuck tasks — partial progress is always preserved, and the system naturally resumes.

## Current code

- `src/types.ts:140-146` — `AgentResult` already defines `status: "done" | "partial" | "failed"` but `partial` is never acted upon
- `src/tree/default-tree.ts` — No condition for partial work. The existing `hasUnverifiedWork` (line 42-44) checks `hasUncommittedChanges` and routes to "review", which is for adversarial review of uncommitted work, NOT for resuming partial agent work
- `src/state/world.ts` — No function to detect partial work status
- `src/prompts/reactive.ts` — No continuation prompt builder

## What to build

### 1. Add a partial-work state file convention

When an agent exits with `status: partial`, it should write `.shoe-makers/state/partial-work.md` describing what was done and what remains. This file is the signal for the tree.

### 2. Add world state reader for partial work

In `src/state/world.ts`, add a function:
```typescript
export async function checkHasPartialWork(repoRoot: string): Promise<boolean> {
  return fileExists(join(repoRoot, ".shoe-makers", "state", "partial-work.md"));
}
```

Add `hasPartialWork: boolean` to the `WorldState` type in `src/types.ts`.

### 3. Add tree condition and node

In `src/tree/default-tree.ts`:
- Add `function hasPartialWork(state: WorldState): boolean { return state.hasPartialWork; }`
- Add a new node in the reactive zone, AFTER unresolved critiques but BEFORE unreviewed commits:
  ```
  makeConditionAction("partial-work", hasPartialWork, "continue-work"),
  ```

Rationale for placement: partial work should be resumed before new review cycles start, but after critiques are fixed (quality first).

### 4. Add continuation prompt builder

In `src/prompts/reactive.ts`, add:
```typescript
export function buildContinueWorkPrompt(): string {
  return `# Continue Partial Work

A previous elf started work but didn't finish. Resume where they left off.

1. Read \`.shoe-makers/state/partial-work.md\` to understand what was done and what remains
2. Read the relevant source files referenced in the partial work description
3. Continue the work described
4. Run \`bun test\` to confirm nothing is broken
5. Commit your work
6. If you finish, delete \`.shoe-makers/state/partial-work.md\`
7. If you can't finish either, update partial-work.md with your progress${OFF_LIMITS}`;
}
```

### 5. Wire into prompt generation

In `src/prompts/index.ts`, add the `"continue-work"` case to `generatePrompt()` that calls `buildContinueWorkPrompt()`.

### 6. Update buildWorldState in setup.ts

In `src/setup.ts`, add `checkHasPartialWork` to the parallel Promise.all and pass it through to the WorldState.

## Patterns to follow

- Tree conditions are pure functions: `(state: WorldState) => boolean` (see `default-tree.ts:23-76`)
- World state readers use `fileExists` from `src/utils/fs.ts` (see `checkHasWorkItem` at `world.ts:124`)
- Prompt builders return string templates (see `reactive.ts:4-75`)
- `generatePrompt` dispatches by action type (see `prompts/index.ts`)

## Tests to write

In `src/__tests__/default-tree.test.ts`:
- Test that `partial-work` condition fires when `hasPartialWork: true`
- Test that it fires before `unreviewed-commits`
- Test that `continue-work` skill is selected

In `src/__tests__/world.test.ts`:
- Test `checkHasPartialWork` returns true when file exists
- Test `checkHasPartialWork` returns false when file doesn't exist

In `src/__tests__/prompts.test.ts`:
- Test that `generatePrompt("continue-work", ...)` returns a prompt containing "Continue Partial Work"

## What NOT to change

- Do not modify the existing `hasUnverifiedWork` / "review" flow — that's for uncommitted changes, different purpose
- Do not modify `.shoe-makers/invariants.md`
- Do not add a new skill `.md` file — this is a reactive prompt, not a skill
- Do not modify the scheduler or shift runner — just the tree routing and prompt

## Decision Rationale

Chosen over candidate #1 (doc-sync) because:
- The stale invariants require human action on `invariants.md` and `claim-evidence.yaml` — elves can't fix the root cause
- ContinueAgent is a foundational architectural feature described in the spec but completely unimplemented
- This adds real capability (partial work resumption) rather than just documentation alignment
- It directly addresses a specified-only gap in the most actionable way

Chosen over candidate #3 (prompt tests) because:
- Implementation gaps are higher priority than test coverage gaps
- The existing prompt test coverage via `prompts.test.ts` is adequate
