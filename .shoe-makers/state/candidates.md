# Candidates

## 1. Tree evaluation trace in setup output
**Type**: improve
**skill-type**: implement
**Impact**: high
**Reasoning**: Agents currently can't see *why* the behaviour tree chose a particular action. Adding a trace showing each condition check and its result (e.g., `✗ tests-failing: testsPass=true`, `✓ has-candidates → prioritise`) to the setup output or next-action.md would make the system dramatically easier to debug. When an elf gets "explore" as its action, it can't tell whether it's because everything is clean (innovation tier) or because some condition check had unexpected data. This directly addresses "Could it be easier to use by agents?" Files: `src/tree/evaluate.ts`, `src/setup.ts`.

## 2. Candidate archive to prevent rediscovery
**Type**: improve
**skill-type**: implement
**Impact**: medium
**Reasoning**: When prioritise consumes candidates.md, that knowledge is deleted. If an executor fails or a new explore cycle runs hours later, the elf rediscovers the same ideas from scratch. Archiving consumed candidates to `.shoe-makers/candidates-archive/YYYY-MM-DD-NNN.md` would let future explore elves see "this candidate appeared 3 times but was never selected — why?" The explore prompt could include a brief summary of recent archives. This addresses "Could the explore/prioritise/execute cycle itself be improved?" Files: `src/prompts.ts` (explore/prioritise prompts), new `src/archive/candidates.ts`.

## 3. Push branch to remote after substantive work
**Type**: improve
**skill-type**: implement
**Impact**: high
**Reasoning**: The branching strategy wiki page describes the shoemakers branch being pushed so humans can review it in the morning. Currently the system never pushes — commits stay local. Adding a `git push` step after substantive work (execute-work-item, fix-tests, fix-critique) would ensure the human can actually see the overnight work. This is arguably the most impactful missing piece for the system's core value proposition. Files: `src/scheduler/shift.ts` or `src/shift.ts`, `wiki/pages/branching-strategy.md`.
