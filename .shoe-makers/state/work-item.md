skill-type: health

# Split prompt-builders.test.ts into focused test files for health improvement

## Wiki Spec

No specific wiki requirement for test file structure. Codebase convention is to split large test files by domain.

## Current Code

`src/__tests__/prompt-builders.test.ts` (363 lines, score 93) is the worst-scoring file. It tests 11 prompt builder functions:

**Reactive** (5 builders, ~155 lines):
- `buildFixTestsPrompt` (3 tests)
- `buildFixCritiquePrompt` (2 tests)
- `buildCritiquePrompt` (8 tests)
- `buildReviewPrompt` (2 tests)
- `buildInboxPrompt` (2 tests)

**Proactive** (6 builders, ~208 lines):
- `buildExplorePrompt` (7 tests)
- `buildPrioritisePrompt` (2 tests)
- `buildExecutePrompt` (4 tests)
- `buildDeadCodePrompt` (2 tests)
- `buildInnovatePrompt` (3 tests)
- `buildEvaluateInsightPrompt` (2 tests)

## What to Build

Split into 2 files:

1. **`src/__tests__/prompt-builders-reactive.test.ts`** — Tests for buildFixTestsPrompt, buildFixCritiquePrompt, buildCritiquePrompt, buildReviewPrompt, buildInboxPrompt (~155 lines)

2. **`src/__tests__/prompt-builders-proactive.test.ts`** — Tests for buildExplorePrompt, buildPrioritisePrompt, buildExecutePrompt, buildDeadCodePrompt, buildInnovatePrompt, buildEvaluateInsightPrompt (~208 lines)

3. **Delete** `src/__tests__/prompt-builders.test.ts` after the split.

Each file must:
- Import only the functions it tests
- Copy any shared helpers/setup
- Keep the exact same test cases

## Patterns to Follow

- Recent splits: `world-git.test.ts` / `world-state-files.test.ts` / `world-critiques.test.ts`
- Earlier split: `prompts-core.test.ts` / `prompts-creative.test.ts` / `prompts-reactive.test.ts`

## Tests to Write

No new tests. All existing 35 tests must pass. Total count (950) must remain unchanged.

## What NOT to Change

- Do NOT modify any test logic or assertions
- Do NOT modify source files
- Do NOT modify `.shoe-makers/invariants.md`

## Decision Rationale

Last remaining health candidate from the explore list. Improving the worst-scoring file raises the health floor toward 100.
