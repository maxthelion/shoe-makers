# Candidates

## 1. Reduce prompts.test.ts complexity with data-driven tier tests
**Type**: health
**skill-type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` (score 91) is the worst-health file. The "explore and prioritise tier switching" describe block (lines 317-376) repeats nearly identical `expectPromptContains` calls across 12 tests. These can be refactored into parameterised data-driven tests: an array of `[description, stateArgs, expectedContains, expectedNotContains]` tuples iterated in a loop. This would cut ~50 lines without reducing test coverage. The `makeStateWithGaps` helper could also move to `test-utils.ts`.

## 2. Candidate archive to prevent rediscovery
**Type**: improve
**skill-type**: implement
**Impact**: medium
**Reasoning**: When prioritise consumes candidates.md, that knowledge is deleted. If an executor fails or a new explore cycle runs hours later, the elf rediscovers the same ideas from scratch. Archiving consumed candidates to `.shoe-makers/candidates-archive/YYYY-MM-DD-NNN.md` would let future explore elves see "this candidate appeared 3 times but was never selected — why?" This addresses "Could the explore/prioritise/execute cycle itself be improved?" Files: `src/prompts.ts` (explore/prioritise prompts), new archive logic in prioritise prompt.

## 3. Push branch to remote after substantive work
**Type**: improve
**skill-type**: implement
**Impact**: high
**Reasoning**: The branching strategy wiki page describes the shoemakers branch being pushed so humans can review it in the morning. Currently the system never pushes — commits stay local. Adding a `git push` step after the shift ends (in `src/shift.ts`) would ensure the human can actually see the overnight work. This is arguably the most impactful missing piece for the system's core value proposition. Files: `src/shift.ts`, `wiki/pages/branching-strategy.md`.
