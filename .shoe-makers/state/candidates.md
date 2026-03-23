# Candidates

## 1. Fix auto-commit housekeeping review marker skip
**Type**: bug-fix
**skill-type**: bug-fix
**Impact**: high
**Reasoning**: The `autoCommitHousekeeping` function in `src/setup.ts` updates `last-reviewed-commit` to HEAD after auto-committing, which can skip review of code commits made between the previous marker and the housekeeping commit. If an elf makes a code change and setup runs, the auto-commit for shift log entries will mark everything (including the unreviewed code) as reviewed. Fix: save the previous marker value and only advance it past the auto-commit if no other commits were made between the old marker and the auto-commit.

## 2. Add "mixed reactive and explore" test for buildDescription
**Type**: test-coverage
**skill-type**: test
**Impact**: medium
**Reasoning**: The "mixed reactive and explore" arc narrative path in `src/log/shift-summary.ts:155-163` has zero test coverage. A test with explore traces before reactive traces should assert the "mixed" description.

## 3. Add verify skill invariant re-check
**Type**: implement
**skill-type**: implement
**Impact**: high
**Reasoning**: `src/skills/verify.ts:21-24` documents the invariant re-check gap. Re-running invariants after work would catch spec assertion breaks. The checker exists in `src/verify/invariants.ts`.

## 4. CHANGELOG creation
**Type**: doc-sync
**skill-type**: doc-sync
**Impact**: medium
**Reasoning**: `.shoe-makers/invariants.md` section 3.5 specifies a CHANGELOG in Keep a Changelog format. None exists.

## 5. Improve health score — reduce setup.ts complexity
**Type**: health
**skill-type**: health
**Impact**: medium
**Reasoning**: Health dropped to 99/100 with `src/setup.ts` at score 94 as a worst file. The auto-commit feature added ~60 lines. Extracting `autoCommitHousekeeping` and `isAllHousekeeping` to a separate `src/utils/housekeeping.ts` module would improve the health score and separation of concerns.
