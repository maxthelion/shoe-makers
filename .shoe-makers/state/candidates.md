# Candidates

## 1. Reduce invariants.test.ts complexity by consolidating temp-dir helpers
**Type**: health
**skill-type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/invariants.test.ts` (score 94) has 6 helper functions (`writeWikiPage`, `writeSourceFile`, `writeTestFile`, `writeEvidence`, `writeInvariants`, `writeExclusions`) that are thin wrappers around `mkdir` + `writeFile` for a temp directory. These can be consolidated into a single generic `writeFile(subpath, content)` helper, cutting ~20 lines of boilerplate. File: `src/__tests__/invariants.test.ts`.

## 2. Candidate archive to prevent rediscovery across shifts
**Type**: improve
**skill-type**: implement
**Impact**: medium
**Reasoning**: When prioritise consumes candidates.md, that knowledge is deleted. Archiving consumed candidates to `.shoe-makers/candidates-archive/YYYY-MM-DD-NNN.md` would give future explore elves visibility into past decisions and prevent rediscovering the same ideas. Files: prioritise prompt in `src/prompts.ts`, new archive directory.

## 3. Add unspecified invariant tracking to explore prompt
**Type**: improve
**skill-type**: implement
**Impact**: low
**Reasoning**: The assessment tracks "unspecified" invariants (code that works but has no spec claim). The explore prompt doesn't mention these or suggest the elf propose new invariants for them. Adding a section to the explore prompt that lists unspecified features would help close the spec-code gap from the other direction. Files: `src/prompts.ts` (explore case).
