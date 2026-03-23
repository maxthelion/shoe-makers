# Candidates

## 1. Add insight count to WorldState and assessment
**Type**: implement
**Impact**: high
**Confidence**: medium
**Risk**: medium
**Reasoning**: Wiki spec `creative-exploration.md` describes insights workflow. Currently `WorldState` has no `insightCount` field. The assessment (`src/skills/assess.ts`) doesn't read `.shoe-makers/insights/`. Adding this would: (a) surface insight presence in the assessment, (b) let the tree or prioritise know insights exist, (c) complete the creative exploration data flow. Changes: `src/types.ts` (add `insightCount: number` to WorldState), `src/state/world.ts` (read insights dir, count files), `src/__tests__/world.test.ts` (test insight counting).

## 2. Add integration test verifying explore→prioritise→execute cycle
**Type**: test
**Impact**: medium
**Confidence**: medium
**Risk**: medium
**Reasoning**: The three-phase orchestration (explore→prioritise→execute) is the core workflow but has no end-to-end test. A test that: (a) creates a temp repo, (b) runs setup in explore mode, (c) verifies candidates.md prompt is generated, (d) simulates prioritise creating work-item.md, (e) verifies execute prompt references the work item — would be valuable for catching regressions in the prompt generation pipeline.

## 3. Verify all skill template maps-to values match ActionType
**Type**: test
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: Each skill template has a `maps-to:` frontmatter field that should correspond to a valid ActionType. Currently no test verifies this mapping. A test could parse each template's frontmatter and verify the maps-to value is a valid action type from the tree. Prevents a class of silent failures where a skill references a non-existent action.
