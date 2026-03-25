# Candidates

## 1. Add unit tests for world.ts utility functions
**Type**: test-coverage
**Impact**: high
**Reasoning**: `src/state/world.ts` exports four utility functions that are only tested indirectly through `readWorldState()`: `countUnresolvedCritiques()` (lines 105-119), `checkHasWorkItem()` (lines 124-126), `checkHasCandidates()` (lines 131-133), and `readWorkItemSkillType()` (lines 140-152). These functions drive the behaviour tree's routing decisions — `countUnresolvedCritiques` gates fix-critique, `checkHasWorkItem` gates execute-work-item, `checkHasCandidates` gates prioritise, and `readWorkItemSkillType` determines which skill prompt to use. A bug in any of these silently misroutes the tree. The `RESOLVED_PATTERN` regex (line 103) is also only tested indirectly. Direct unit tests would verify edge cases like: empty findings dir, critique files without Status section, malformed work-item.md, work-item with and without skill-type line.

## 2. Add unit tests for prompts/helpers.ts formatSkillSection
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/helpers.ts` exports `formatSkillSection()` (line 75-77) which formats a skill definition as a markdown section. It's used in `src/prompts/index.ts` to build the skill catalog in prompts but has no dedicated unit test. While the function is simple, the prompt generation system relies on it producing correctly formatted output. A broken format could give elves garbled skill instructions. The existing 109 integration tests in `prompts.test.ts` provide some implicit coverage, but a direct test would catch regressions faster. `determineTier()` and `isInnovationTier()` already have good direct tests.

## 3. Doc-sync: update wiki verification.md to reflect current review model
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The wiki page `wiki/pages/verification.md` describes the verification system, but the two specified-only invariants ("commit or revert" and "Verification has caught and reverted bad work") indicate the wiki still references the old verify model that was removed. The finding `invariant-update-2026-03-25.md` documents this gap. While `invariants.md` is human-only, the wiki pages CAN be updated by elves with doc-sync skill. Updating `verification.md` (and potentially `architecture.md`) to describe the current adversarial review model instead of the removed commit-or-revert model would bring the spec in line with the code. This would also prepare the ground for the human to update the invariants.

## 4. Stale invariants finding needs human attention (informational)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Finding `invariant-update-2026-03-25.md` documents two specified-only invariants referencing the removed verify model. Only humans can update `.shoe-makers/invariants.md`. This candidate is informational — no elf action possible beyond keeping it visible.
