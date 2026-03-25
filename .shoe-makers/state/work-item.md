# Improve code health of the three worst-scoring test files

skill-type: octoclean-fix

## Context

The three files dragging health from 100 to 99 are all oversized test files:

| File | Score | Lines | Issue |
|------|-------|-------|-------|
| `src/__tests__/prompt-builders.test.ts` | 94 | 339 | Tests 12 prompt builders in one monolithic file |
| `src/__tests__/prompts-features.test.ts` | 94 | 326 | Tests cross-cutting prompt features (process temp, tiers, skills, violations, insights, innovate) in one file |
| `src/__tests__/invariants.test.ts` | 95 | 316 | Mixes unit tests (YAML parsing, claim extraction) with integration tests (real repo checks) |

## What to do

### 1. Split `prompt-builders.test.ts` into two files

The file has two clear sections (marked by comments):

- **Lines 1-159**: Reactive prompt builders (`buildFixTestsPrompt`, `buildFixCritiquePrompt`, `buildCritiquePrompt`, `buildContinueWorkPrompt`, `buildReviewPrompt`, `buildInboxPrompt`)
- **Lines 161-339**: Three-phase prompt builders (`buildExplorePrompt`, `buildPrioritisePrompt`, `buildExecutePrompt`, `buildDeadCodePrompt`, `buildInnovatePrompt`, `buildEvaluateInsightPrompt`)

Create:
- `src/__tests__/prompt-builders-reactive.test.ts` — lines 1-159 (reactive builders)
- `src/__tests__/prompt-builders-three-phase.test.ts` — lines 161-339 (three-phase builders)

Each file imports only what it needs. Keep the same test logic — do NOT rewrite tests, just split them.

### 2. Split `prompts-features.test.ts` into two files

Natural split points by concern:

- **Lines 1-156**: Explore/prioritise feature tests (process temperature, tier switching, skill catalog)
- **Lines 157-326**: Action parsing, critique violations, insight lifecycle, innovate prompt, evaluate-insight prompt

Create:
- `src/__tests__/prompts-explore-features.test.ts` — explore/prioritise tier and temperature tests
- `src/__tests__/prompts-action-features.test.ts` — parseActionType, critique violations, insight lifecycle, innovate/evaluate-insight

### 3. Split `invariants.test.ts` into two files

Split by test type:

- **Unit tests** (lines 36-108): `AgentResult` type contract, `parseClaimEvidenceYaml` — these are pure unit tests with no filesystem
- **Integration tests** (lines 110-316): `extractInvariantClaims`, `extractClaims`, `checkInvariants` — these use temp dirs and real repo

Create:
- `src/__tests__/invariants-unit.test.ts` — `AgentResult` type contract + `parseClaimEvidenceYaml` tests (no temp dir needed)
- `src/__tests__/invariants-integration.test.ts` — `extractInvariantClaims`, `extractClaims`, `checkInvariants` tests (with temp dir setup)

## Patterns to follow

- Each new file gets its own imports — only import what that file actually uses
- Keep the `test-utils` import pattern: `import { makeState, ... } from "./test-utils"`
- The `beforeEach`/`afterEach` temp dir setup in `invariants.test.ts` only goes in the integration file
- The local `makeState()` wrapper in `prompts-features.test.ts` (line 8-10) goes in whichever file(s) use it
- Helper functions like `expectPromptContains`, `makeSkillMap`, `makeSkill` go in the file that uses them
- Preserve the `describe` block structure exactly — don't rename or reorganize tests within each block

## Tests to run

After each split:
```bash
bun test
```

All existing tests must pass. The total test count should remain the same — we're moving tests, not adding or removing them.

## What NOT to change

- Do NOT modify any test logic, assertions, or test names
- Do NOT add new tests or remove existing tests
- Do NOT modify any source files (only test files)
- Do NOT modify `test-utils.ts`
- Do NOT touch `.shoe-makers/invariants.md`
- Do NOT refactor the prompt builder source code
- Delete the original files only after confirming the split files pass

## Decision Rationale

Chose candidate #1 (octoclean-fix for test files) over the alternatives because:
- The setup prompt says to prefer improvement over writing more tests (#2, #5) or polishing what's clean (#3)
- This directly targets the 3 worst health scores (94, 94, 95) which are the only thing keeping the repo at 99 instead of 100
- It's a mechanical, low-risk refactoring that improves maintainability without changing behaviour
- Candidates #3 (doc-sync) and #4 (setup.ts) are lower impact
