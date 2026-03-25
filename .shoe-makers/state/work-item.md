# Improve health of setup.ts by extracting helper functions

skill-type: octoclean-fix

## Context

`src/setup.ts` is the lowest-scoring file in the codebase at 93/100 health. The overall health is 99/100, and this file is the primary drag. The `main()` function spans lines 34-156 (120+ lines) and handles 6 distinct stages: working hours check, branch setup, assessment, tree evaluation, prompt generation, and housekeeping commits.

## What to change

Extract the `main()` function body into focused stage functions. The function currently has these logical stages that should become named helpers:

### Stage 1: `checkWorkingHours()` (lines 38-47)
Extract the working hours check and early-exit logic.

```typescript
async function handleWorkingHoursCheck(repoRoot: string): Promise<boolean> {
  if (!isWithinWorkingHours(repoRoot)) {
    console.log("[setup] Outside working hours. Exiting.");
    const stateDir = join(repoRoot, ".shoe-makers", "state");
    await mkdir(stateDir, { recursive: true });
    await writeFile(
      join(stateDir, "next-action.md"),
      "# Outside Working Hours\n\nThe shoemakers are sleeping. Do nothing. Exit immediately.\n"
    );
    return false;
  }
  return true;
}
```

### Stage 2: `runAssessmentWithVerification()` (lines 49-76)
Combine branch setup, archiving, assessment, and verification gate into one function. Returns the assessment and related data.

```typescript
interface AssessmentResult {
  assessment: Awaited<ReturnType<typeof assess>>;
  prevActionRaw: string | null;
  prevActionType: ActionType | null;
}

async function runAssessmentWithVerification(repoRoot: string): Promise<AssessmentResult> {
  // archive resolved findings
  // run assessment
  // check health regression
  // run verification gate
  // log assessment
  // return results
}
```

### Stage 3: `evaluateTree()` (lines 78-103)
Bundle inbox reading, world state building, skill loading, tree evaluation, and uncertainty annotation.

```typescript
interface TreeResult {
  skill: string | null;
  trace: TraceEntry[];
  state: WorldState;
  inboxMessages: { file: string; content: string }[];
  loadedSkills: Map<string, SkillDefinition>;
}

async function evaluateTreeAndState(repoRoot: string, branchName: string, assessment: Assessment, config: Config): Promise<TreeResult>
```

### Stage 4: Keep `writeActionPrompt()` (lines 106-155) as the final stage
This handles creative article fetching, wiki summary, permission setup, archiving, and writing the action file. Could stay in `main()` since it's the final orchestration.

## Files to modify

- `src/setup.ts` — extract helper functions, simplify `main()`

## Patterns to follow

- Each helper should be a plain `async function` (not exported unless needed for testing)
- Keep all exports (`logAssessment`, `readInboxMessages`, `formatAction`, `readWikiOverview`) unchanged
- Follow the existing pattern of passing `repoRoot` as first parameter
- Keep `console.log("[setup] ...")` logging in helpers (matches existing style)

## What NOT to change

- Do NOT modify test files
- Do NOT change public API (exported functions must keep same signatures)
- Do NOT move functions to new files — keep everything in setup.ts
- Do NOT change the order of operations (branch → archive → assess → verify → tree → prompt)
- Do NOT modify any other source files
- Do NOT add external dependencies

## Tests to write

No new test files needed. Run `bun test` to confirm existing tests still pass. The refactoring is purely structural — same operations in same order, just grouped into named functions.

## Verification

- `bun test` passes
- `bun run setup` still produces correct output
- Health score does not regress (should improve from 93)
- `main()` function body reduced to ~30-40 lines of stage calls

## Decision Rationale

Candidate #1 (setup.ts health) was chosen over others because:
- It targets the **worst-scoring file** (93 vs 94 for all others) — highest impact on overall health
- Candidates #3-5 target test files, but the octoclean-fix skill explicitly says "Do not modify test files"
- Candidate #2 (dead code in types.ts) is lower impact — removing 2 optional fields improves clarity but doesn't affect health score
- Improving setup.ts readability also helps future elves understand the setup pipeline
