# Candidates

## 1. Add drift-prevention test for shift-log-parser TITLE_TO_ACTION vs prompts helpers TITLE_TO_ACTION
**Type**: test-coverage
**Impact**: medium
**Reasoning**: There are two separate `TITLE_TO_ACTION` mappings: `src/prompts/helpers.ts:15-28` and `src/log/shift-log-parser.ts:6-19`. Both map regex patterns to action names but can drift independently — as the `continue-work` bug demonstrated. A test should verify that every action recognized by the prompts helper is also recognized by the shift-log-parser. This requires generating all prompt titles (via `generatePrompt` for all action types) and verifying that `parseShiftLogActions` recognizes each one. This would catch title mismatches across the two modules.

## 2. Add test for multiple non-contiguous review loops in `computeProcessPatterns`
**Type**: test-coverage
**Impact**: low
**Reasoning**: `computeProcessPatterns` in `src/log/shift-log-parser.ts:63-76` counts review loops (3+ consecutive critique/fix-critique actions). The existing test at line 74-77 tests a single loop, but doesn't test multiple separate loops in one shift (e.g., `[critique, fix-critique, critique, explore, critique, fix-critique, critique]` = 2 loops). The review-loop-breaker fires at count >= 3 in the default tree, so multi-loop counting correctness matters for shifts with recurring quality issues.

## 3. Add test for `formatProcessTemperature` in three-phase.ts
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/prompts/three-phase.ts:9-30` has a `formatProcessTemperature` function that generates different guidance text based on the shift's reactive ratio (>0.6 = high reactive, <0.3 = stable). This is tested indirectly through `buildExplorePrompt` but has no direct unit test. The thresholds (0.6 and 0.3) are important for prompt quality — if they drift, the elf gets wrong guidance. A direct test would document the expected behaviour.
