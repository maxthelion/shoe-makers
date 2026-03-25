# Candidates

## 1. Consolidate prompts-features.test.ts (score 93)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts-features.test.ts` is now one of the three worst files at 93. The "innovate prompt" describe block (lines 337-393) has 8 tests where most call the same `generatePrompt("innovate", ...)` with the same args — similar consolidation pattern to what was done for prompt-builders. The "evaluate-insight prompt" block (lines 395-424) has 6 tests on the same prompt output. Merging static-content tests could reduce LOC by ~40 lines.

## 2. Consolidate world.test.ts (score 93)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` is tied for worst at 93 and is 350 lines. It likely has temp-dir beforeEach/afterEach patterns that could use `withTempDir` from test-utils. Consolidating file-existence tests could reduce duplication.

## 3. Split setup.ts (score 93, 349 lines)
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is the largest non-test source file at 349 lines and scores 93. It orchestrates branch creation, assessment, tree evaluation, next-action writing, verification gate, and Wikipedia fetch. Extracting sub-functions (e.g., `writNextAction()`, `runVerificationGate()`) into a separate `src/scheduler/setup-helpers.ts` would improve readability and score. Wiki `architecture.md` specifies "one invocation, one action" — the setup script should be easy to follow.
