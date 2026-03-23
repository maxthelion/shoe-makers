# Candidates

## 1. Fix readWorkItemSkillType false-positive keyword matching
**Type**: fix
**Impact**: high
**Confidence**: high
**Risk**: low
**Reasoning**: `src/state/world.ts:141-150` uses naive keyword matching — any work item with "dead-code" in the first 5 lines of its title gets routed as a dead-code removal task, even if the work item is about something else (e.g. adding tests for the dead-code prompt). This caused a misroute in the current session. The fix should use the skill's `maps-to` frontmatter field from the work item or a more structured detection approach. See `wiki/pages/behaviour-tree.md` for routing spec.

## 2. Improve health score of src/init-skill-templates.ts
**Type**: health
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Setup reports this file at health score 92 (worst in codebase). It's a large file of string constants for skill templates. Reducing line count by extracting common template sections or splitting into per-skill files would improve the score. File: `src/init-skill-templates.ts`.

## 3. Extract shared utility functions to reduce duplication
**Type**: health
**Impact**: medium
**Confidence**: medium
**Risk**: low
**Reasoning**: `fileExists()` is duplicated in `src/state/world.ts:114` and `src/init.ts:76`. Shell git execution patterns are repeated across `src/skills/assess.ts`, `src/setup.ts`, and `src/state/world.ts`. Extracting shared utilities would improve health scores and reduce maintenance burden.

## 4. Add fix-critique and review prompt dedicated tests
**Type**: test
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/__tests__/prompts.test.ts` now tests all 9 action types in the allActions loop, but `fix-critique` and `review` still lack dedicated tests verifying their specific content (e.g. fix-critique mentions resolving findings, review mentions checking correctness/tests/spec). Following the same pattern used for dead-code tests just added.
