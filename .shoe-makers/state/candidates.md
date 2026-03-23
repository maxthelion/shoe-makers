# Candidates

## 1. Fix worst-file health: shift-log.test.ts (94/100)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/shift-log.test.ts` is the sole lowest-health file at 94/100 (333 lines). The `formatTickLog` tests (12 tests, lines 90-200) follow similar patterns — each creates opts, calls formatTickLog, and checks toContain/not.toContain. These can be consolidated into a data-driven array. The `appendToShiftLog` tests also have repetitive setup patterns. Files: `src/__tests__/shift-log.test.ts`.

## 2. Push branch for morning review
**Type**: health
**Impact**: low
**Reasoning**: The branch has accumulated improvements (evaluateWithTrace fix, prompts.test.ts refactor 93→95, invariants.test.ts refactor 94→95, findings archive cleanup). A final push ensures the morning reviewer sees all work.

## 3. Dead code scan
**Type**: dead-code
**Impact**: low
**Reasoning**: With health at 99/100 and all invariants met, a dead code scan could find unused exports or stale modules. The dead-code skill exists but hasn't been used this shift. Files: all `src/` files.
