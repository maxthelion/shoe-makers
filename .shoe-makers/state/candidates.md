# Candidates

## 1. Doc-sync: Fix remaining stale tick-type references in observability.md and open-questions.md
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/observability.md` line 56 says "during the ASSESS tick" — there is no ASSESS tick, this happens during the explore action's assessment phase. `wiki/pages/open-questions.md` line 39 references "the VERIFY tick rejects work (reverts)", "ASSESS tick", "PRIORITISE re-ranks it", and "WORK tries again" — all stale tick-type names. The system uses behaviour tree actions, not named tick types. Additionally, the description of "VERIFY tick rejects work (reverts)" describes the old commit/revert model which was removed — the system actually uses adversarial critique instead. These are the last remaining stale tick-type references in editable wiki pages (invariants.md also has stale references but is human-only).

## 2. Add direct unit tests for buildInnovatePrompt and buildEvaluateInsightPrompt
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/prompts/three-phase.ts` exports `buildInnovatePrompt` (line 183) and `buildEvaluateInsightPrompt` (line 222). All 9 other prompt builders have direct tests in `src/__tests__/prompts.test.ts` but these two are only tested indirectly through `generatePrompt()`. Adding direct tests would improve consistency.

## 3. Add observability for Wikipedia fetch failures in explore actions
**Type**: bug-fix
**Impact**: low
**Reasoning**: In `src/setup.ts`, Wikipedia fetch failures during explore actions with creative lens silently fall through with no shift log entry, unlike innovate actions which log the failure. Minor observability gap.
