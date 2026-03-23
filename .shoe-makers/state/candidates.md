# Candidates

## 1. Reduce prompts.test.ts complexity with data-driven tier tests
**Type**: health
**skill-type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` (score 91) is the worst-health file. The "explore and prioritise tier switching" describe block has 12 tests that repeat nearly identical `expectPromptContains` calls. These can be refactored into parameterised data-driven tests: an array of `[description, action, stateFactory, expectedContains, expectedNotContains]` tuples iterated in a loop. This would cut ~40 lines without reducing test coverage. File: `src/__tests__/prompts.test.ts`.

## 2. Reduce invariants.test.ts complexity by extracting temp-dir helpers
**Type**: health
**skill-type**: health
**Impact**: low
**Reasoning**: `src/__tests__/invariants.test.ts` (score 94) has 6 helper functions (`writeWikiPage`, `writeSourceFile`, `writeTestFile`, etc.) that are thin wrappers around fs operations bound to a temp directory. These could be consolidated into a single `writeFile(subpath, content)` helper or moved to `test-utils.ts`. File: `src/__tests__/invariants.test.ts`.

## 3. Candidate archive to prevent rediscovery across shifts
**Type**: improve
**skill-type**: implement
**Impact**: medium
**Reasoning**: When prioritise consumes candidates.md, that knowledge is deleted. If a new explore cycle runs later, the elf rediscovers the same ideas from scratch. Archiving consumed candidates to `.shoe-makers/candidates-archive/YYYY-MM-DD-NNN.md` with metadata (which was selected, why) would give future explore elves visibility into past decisions. Files: prioritise prompt in `src/prompts.ts`, new archive directory.
