# Candidates

## 1. Fix worst-file health: invariants.test.ts (94/100)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/invariants.test.ts` is the lowest health file at 94/100 (339 lines). It has repetitive setup patterns with `writeWikiPage`/`writeSourceFile`/`writeTestFile`/`writeClaimEvidence` calls that could be consolidated into fixture helpers. Multiple tests create similar file structures — extracting a shared setup factory would reduce duplication and improve readability. Files: `src/__tests__/invariants.test.ts`, `src/__tests__/test-utils.ts`.

## 2. Fix worst-file health: shift-log.test.ts (94/100)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/shift-log.test.ts` is tied for lowest health at 94/100 (333 lines). The `formatTickLog` tests have similar structure that could benefit from data-driven consolidation, following the pattern used successfully in prompts.test.ts. Files: `src/__tests__/shift-log.test.ts`.

## 3. Archive resolved findings to reduce noise
**Type**: health
**Impact**: low
**Reasoning**: There are 6 findings in `.shoe-makers/findings/` — all resolved critiques. They create noise in the findings count displayed by setup. The existing archive mechanism (`.shoe-makers/findings/archive/`) should be used to move resolved critiques out of the active findings directory, reducing the count to 0 and making it easier to spot new genuine issues.
