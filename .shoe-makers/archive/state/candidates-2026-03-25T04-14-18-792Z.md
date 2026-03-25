# Candidates

## 1. Doc-sync: Fix stale action type references in observability.md and verification.md
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Both `wiki/pages/observability.md` and `wiki/pages/verification.md` reference `implement-spec` and `implement-plan` as action types. These no longer exist — the system uses `execute-work-item` with skill-based routing. observability.md line 29 lists "implement-spec" as an example tree action; line 86 references "implementation actions (implement-spec, implement-plan)". verification.md line 42 says "Implementers (implement-spec, implement-plan) cannot write test files" — but the current permission model in `src/verify/permissions.ts` uses different role names. These stale references could mislead future elves and confuse human reviewers reading the spec.

## 2. Add tests for reactive and three-phase prompt builders
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts` and `src/prompts/three-phase.ts` build the actual prompts that guide elf behaviour. While `prompts.test.ts` tests the top-level `generatePrompt()` and helper functions extensively, the individual builder functions in reactive.ts (e.g. `buildFixTestsPrompt`, `buildCritiquePrompt`) and three-phase.ts (e.g. `buildExplorePrompt`, `buildPrioritisePrompt`, `buildExecuteWorkItemPrompt`) are not tested in isolation. Changes to these could break prompt structure without being caught. Unit tests for each builder would verify they include required sections (skill section, off-limits, context blocks).

## 3. Doc-sync: Fix stale "PRIORITISE tick" references in observability.md and functionality.md
**Type**: doc-sync
**Impact**: low
**Reasoning**: `wiki/pages/observability.md` line 15 says "The PRIORITISE tick has no memory" and line 67 says "Direct input to the PRIORITISE tick". `wiki/pages/functionality.md` line 43 says "feed into the PRIORITISE tick". The system no longer uses tick types — it uses behaviour tree actions. "PRIORITISE tick" should be "prioritise action" to match the current architecture described in tick-types.md and behaviour-tree.md. Small inaccuracy but adds up with the other stale references.

## 4. Verify that `src/verify/permissions.ts` role names match wiki verification.md claims
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` describes role-based permissions with specific action type names (implement-spec, implement-plan, write-tests, critique). The actual implementation in `src/verify/permissions.ts` may use different role names matching the current action types (execute-work-item, fix-tests, critique, explore, etc.). A test that cross-checks the wiki claims against the code would catch this drift. This is related to the 2 specified-only invariants about commit/revert, which are human-only fixes, but the permission role alignment is actionable code work.

## 5. Add observability for Wikipedia fetch failures in explore actions
**Type**: bug-fix
**Impact**: low
**Reasoning**: In `src/setup.ts` lines 90-99, when Wikipedia fetching fails during an `innovate` action, it logs "Wikipedia article fetch failed" to the shift log. But for `explore` actions with creative lens (line 97-99), a null return from `fetchRandomArticle()` silently falls through with no logging. If Wikipedia is consistently unreachable (as in environments with blocked network), this failure is invisible for explore actions. Adding a shift log entry for the explore path would improve observability.
