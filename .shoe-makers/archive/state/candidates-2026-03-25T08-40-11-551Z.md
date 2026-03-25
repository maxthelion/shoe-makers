# Candidates

## 1. Add drift-prevention test: ACTION_TO_SKILL_TYPE and TITLE_TO_ACTION vs ActionType
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/helpers.ts` defines `ACTION_TO_SKILL_TYPE` (maps actions to skill types) and `TITLE_TO_ACTION` (maps prompt titles to actions). Both must cover all `ActionType` values. Currently no test verifies this — if a new action is added to the type but not to these maps, `generatePrompt` would work but `parseActionTypeFromPrompt` would silently return null and `findSkillForAction` would silently skip. This is the same pattern as the successful action-classification drift test. Add tests asserting both maps cover all ActionType values.

## 2. Add test coverage for `buildExplorePrompt` tier-specific sections
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/three-phase.ts` `buildExplorePrompt` generates different sections based on the system's tier (hygiene/implementation/innovation). No test verifies that the tier-specific text is correctly included in the output. A test creating a state with specific invariant counts and asserting the prompt contains the expected tier label and guidance would catch regressions in the explore prompt.

## 3. Pattern Language insight: skills as a generative pattern network
**Type**: improve
**Impact**: low
**Reasoning**: Christopher Alexander's Pattern Language works because patterns reference each other, creating a generative network. The shoe-makers skills currently operate independently — `implement` doesn't know about `test-coverage`, `doc-sync` doesn't know about `health`. A "related skills" field in skill definitions could suggest follow-up work (e.g., implement → "consider test-coverage and doc-sync"). This would make the prioritise phase smarter about balancing work types. Speculative but aligned with the invariant "improvements are not just one type — features, tests, docs, code health, and bug fixes are balanced" (invariants 1.2).
