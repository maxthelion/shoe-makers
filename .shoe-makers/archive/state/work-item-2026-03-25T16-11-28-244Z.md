# Reduce setup.ts complexity by extracting verification gate and permission detection

skill-type: octoclean-fix

## Context

`src/setup.ts` is the 3rd worst file in the codebase (octoclean score 91, 397 lines). The `main()` function (lines 35-202) handles 8+ distinct responsibilities in a single function. Two of these — the verification gate and permission violation detection — are self-contained concerns that can be cleanly extracted.

## What to extract

### 1. Verification gate → `src/scheduler/verification-gate.ts`

Extract lines 72-88 of setup.ts into a new function:

```typescript
export async function runVerificationGate(
  repoRoot: string,
  assessment: Assessment,
  previousActionType: ActionType | null,
  healthRegression: string | null,
): Promise<void>
```

This function should:
- Define WORK_ACTIONS internally
- Call `commitOrRevert()` with test/health status
- Execute `git revert --no-edit HEAD` if decision is "revert"
- Log to shift log on revert
- Warn on revert failure

The spec (`wiki/pages/verification.md`) describes verification as a distinct responsibility: "Automated commit-or-revert gate". It belongs in `src/scheduler/` alongside `housekeeping.ts`.

### 2. Permission violation setup → `src/scheduler/permission-setup.ts`

Extract lines 133-157 (previous action snapshot + permission violation detection) into:

```typescript
export async function setupPermissionContext(
  repoRoot: string,
  skill: string | null,
): Promise<string[] | undefined>
```

This function should:
- Read the previous action
- Write the `previous-action-type` file
- Call `detectPermissionViolations()` if skill is "critique"
- Call `writePermissionViolationFinding()` if violations found
- Return the violations array (or undefined)

### 3. Validation pattern lookup

Extract lines 167-182 into a helper in `src/prompts/helpers.ts`:

```typescript
export function findValidationPatterns(
  previousAction: string | null,
  loadedSkills: Map<string, SkillDefinition>,
): string[] | undefined
```

## Patterns to follow

- Look at `src/scheduler/housekeeping.ts` for the pattern: a focused module in `src/scheduler/` with a single exported function
- Keep the same error handling behavior (try-catch with console.warn)
- Keep the same imports — just move them to the new files
- The `main()` function should call these extracted functions, keeping the same flow

## Tests to write

Add tests in `src/__tests__/verification-gate.test.ts`:
- Reverts when tests fail and previous action was a work action
- Does NOT revert when previous action was orchestration (explore/prioritise)
- Does NOT revert when tests pass and no health regression
- Handles revert failure gracefully

Add tests in `src/__tests__/permission-setup.test.ts`:
- Writes previous-action-type file from last action
- Returns violations when skill is critique and violations exist
- Returns undefined when skill is not critique
- Handles missing previous action

## What NOT to change

- Do NOT change any behavior — this is pure refactoring
- Do NOT modify `src/verify/commit-or-revert.ts` or `src/verify/detect-violations.ts` — those stay as-is
- Do NOT touch the tree evaluation, assessment, or prompt generation logic
- Do NOT rename or move `setup.ts` itself
- Do NOT change the public exports of setup.ts (`logAssessment`, `readInboxMessages`, `formatAction`, `readWikiOverview`, `isAllHousekeeping`, `HOUSEKEEPING_PATHS`)
- Do NOT modify any test files other than adding new ones

## Verification

After refactoring:
1. `bun test` must pass (all 890+ tests)
2. `bun run setup` must produce the same output as before
3. The octoclean score for setup.ts should improve (fewer lines, fewer concerns)

## Decision Rationale

Chose candidate #1 over candidate #2 (test file splitting) because:
- setup.ts is production code, not test code — improving it has more impact on maintainability
- The verification gate and permission detection are well-defined extraction targets with clear boundaries
- Test files with low health scores are less risky than production files with low scores
- The state says "prefer implementation, improvement, and creative work over writing more tests"
- Candidates #3-5 are low impact (test edge cases, minor doc fix, speculative idea)
