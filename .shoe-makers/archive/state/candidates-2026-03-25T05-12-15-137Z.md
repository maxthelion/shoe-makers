# Candidates

## 1. Add tests for shift-summary.ts
**Type**: test-coverage
**Impact**: high
**Reasoning**: `src/log/shift-summary.ts` (291 LOC) has zero test coverage. It contains complex logic for categorising actions into ShiftSummary buckets (fix, feature, test, docs, health, review) and TraceAnalysis (reactive/routine/explore classification by tree depth). This is a critical observability module — the shift log dashboard depends on it producing accurate summaries. A bug here would silently misreport shift activity to humans reviewing overnight work. Invariant 1.2 ("the branch tells a coherent story") depends on this working correctly.

## 2. Add direct tests for prompts/helpers.ts
**Type**: test-coverage
**Impact**: high
**Reasoning**: `src/prompts/helpers.ts` (~200 LOC) determines tier classification (hygiene/implementation/innovation), formats assessment summaries, and maps skill types. It's indirectly tested via `prompts.test.ts` integration tests but has no direct unit tests for edge cases like null health scores, empty invariant results, or boundary conditions in tier determination. The `isInnovationTier()` function controls whether the tree routes to `innovate` — a bug here changes system behaviour silently. Referenced by invariants 2.3 (three-phase orchestration) and the innovation tier logic in `default-tree.ts:66-72`.

## 3. Add direct tests for prompts/reactive.ts and prompts/three-phase.ts
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts` (~150 LOC) and `src/prompts/three-phase.ts` (249 LOC) generate the actual prompts that elves receive. They're tested indirectly via integration tests in `prompts.test.ts` (650 LOC), but the prompt builders contain conditional logic (permission violations section, Wikipedia lens injection, wiki summary inclusion for innovate) that isn't directly unit-tested. A formatting bug could give an elf broken instructions. Lower priority than helpers.ts since integration tests provide some coverage.

## 4. Bug fix: logAssessment displays null typecheckPass as "FAIL"
**Type**: bug-fix
**Impact**: low
**Reasoning**: In `src/setup.ts:254`, `logAssessment()` checks `assessment.typecheckPass !== undefined` then logs `typecheckPass ? "pass" : "FAIL"`. When `runTypecheck()` returns `null` (environment issue like missing bun-types), `null !== undefined` is true and `null ? "pass" : "FAIL"` displays "FAIL" — misleading. The current workaround displays "Typecheck: skipped" only when typecheckPass is explicitly undefined. Fix: check for `null` in the display logic. The tree itself handles null correctly (`=== false` check), so this is cosmetic but confusing for humans reading setup output.

## 5. Stale invariants finding needs human attention
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Finding `invariant-update-2026-03-25.md` documents two specified-only invariants ("commit or revert" and "Verification has caught and reverted bad work") that reference the removed verify model. These invariants can only be updated by humans per the permission model. This candidate is informational — it will resolve when the human updates `.shoe-makers/invariants.md`. No elf action possible beyond surfacing it (which the finding already does).
