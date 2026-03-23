# Candidates

## 1. Add "mixed reactive and explore" test for buildDescription arc narrative
**Type**: test-coverage
**skill-type**: test
**Impact**: medium
**Reasoning**: Critique-119 identified that `buildDescription` in `src/log/shift-summary.ts:147-163` has two arc narrative paths: "started reactive, then stabilised" (reactive before explore) and "mixed reactive and explore" (explore before reactive). The "mixed" path has zero test coverage. A test should create steps where explore traces appear before reactive traces and assert the "mixed" description appears. Quick, targeted, fills a concrete gap.

## 2. Add verify skill invariant re-check after work execution
**Type**: implement
**skill-type**: implement
**Impact**: high
**Reasoning**: `src/skills/verify.ts:21-24` documents this as a gap. The verify skill currently only checks test pass/fail and health regression. Re-running the invariant pipeline after work would catch cases where code changes silently break spec assertions. The invariants checker already exists — needs to be called from verify and new failures surfaced as findings.

## 3. CHANGELOG creation and maintenance
**Type**: doc-sync
**skill-type**: doc-sync
**Impact**: medium
**Reasoning**: `.shoe-makers/invariants.md` section 3.5 states "The CHANGELOG tracks user-facing changes in Keep a Changelog format" but no CHANGELOG file exists. Spec-code inconsistency. Creating the initial CHANGELOG.md aligned with Keep a Changelog format.

## 4. Improve review/archive cycle efficiency
**Type**: implement
**skill-type**: implement
**Impact**: high
**Reasoning**: The current review cycle creates a painful loop: every critique commit needs reviewing, every archive commit needs reviewing, creating more commits to review. The tree gets stuck cycling through critique → archive → critique → archive before reaching explore. Consider: (a) making the setup script auto-review its own archive commits (they're mechanical, not elf-authored), or (b) combining archive + review-marker-update in the setup script so archive commits don't trigger the unreviewed-commits condition. This would save 2-4 ticks per cycle and let elves spend more time on productive work.

## 5. Test quality heuristic checker for verification
**Type**: implement
**skill-type**: implement
**Impact**: medium
**Reasoning**: `wiki/pages/verification.md` describes test quality assessment. A lightweight checker in `src/verify/` could flag: test files that don't assert anything, test files that don't import the module under test, and trivial `expect(true).toBe(true)` patterns. Would surface test quality issues as structured data for the reviewer.
