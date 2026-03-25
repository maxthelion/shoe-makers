# Priority: split monolithic files to reduce merge conflicts

Every shift produces 400+ commits that heavily modify the same core files. When main diverges from the branch (which is inevitable — shifts aren't always merged immediately), the conflicts are painful. This is a structural problem.

## Files that cause the most conflicts

1. **`src/prompts/three-phase.ts`** — every action's prompt is in one file. Two branches adding or modifying different actions conflict.
2. **`src/setup.ts`** — the main orchestrator. Everything touches it.
3. **`src/types.ts`** — every new action or field goes here.
4. **`src/__tests__/prompts.test.ts`** — monolithic test file for all prompts.
5. **`src/__tests__/setup.test.ts`** — same.
6. **`.shoe-makers/claim-evidence.yaml`** — single file for all evidence patterns.

## What to do

### Split prompts into individual files
Each action's prompt should be its own file:
- `src/prompts/explore.ts`
- `src/prompts/innovate.ts`
- `src/prompts/evaluate-insight.ts`
- `src/prompts/critique.ts`
- etc.

The index file re-exports them. Two branches adding different actions touch different files.

### Split tests to match
- `src/__tests__/prompts/explore.test.ts`
- `src/__tests__/prompts/innovate.test.ts`
- etc.

### Split claim-evidence by section
Instead of one YAML file, use one file per invariant section:
- `.shoe-makers/claim-evidence/section-1.yaml`
- `.shoe-makers/claim-evidence/section-2.yaml`
- etc.

### Extract setup helpers
`setup.ts` is too big. Extract:
- Branch management → `src/setup/branch.ts`
- World state building → `src/setup/world-state.ts`
- Action formatting → `src/setup/format-action.ts`
- Housekeeping → `src/setup/housekeeping.ts`

## Why this matters

This isn't about code quality — it's about merge-ability. The structured skills spec (see `wiki/pages/structured-skills.md`) also helps here: if prompts live in skill markdown files instead of TypeScript, parallel branches modify different files entirely.
