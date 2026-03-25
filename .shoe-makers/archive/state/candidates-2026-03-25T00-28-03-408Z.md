# Candidates

## 1. Update README tree diagram and three-phase description
**Type**: doc-sync
**Impact**: high
**Reasoning**: The README tree diagram (lines 17-27) shows 9 nodes but the actual tree in `src/tree/default-tree.ts` has 11 nodes — missing `[insights exist?] → Evaluate insight` and `[innovation tier?] → Innovate`. The three-phase description (lines 36-40) doesn't mention Innovate or Evaluate-insight as distinct phases. Invariant 3.5 says "The README reflects current capabilities as described by the invariants — not aspirational, not stale." This is the most visible spec violation remaining. File: `README.md`.

## 2. Add instruction for innovate elf to log insight filename to shift log
**Type**: implement
**Impact**: medium
**Reasoning**: Invariant 2.6.1 says "The shift log entry for an innovate tick should include: the Wikipedia article title, whether an insight was written, and the insight filename." Setup.ts now logs the article title, but there's no instruction for the elf to log whether an insight was written or its filename. The innovate prompt in `src/prompts/three-phase.ts` should tell the elf to append to the shift log after writing the insight file, including the filename. This completes the observability loop. File: `src/prompts/three-phase.ts`.

## 3. Handle subsection numbering (e.g., 2.6.1) in invariant claim extraction
**Type**: bug-fix
**Impact**: medium
**Reasoning**: The `extractInvariantClaims` function in `src/verify/extract-claims.ts` matches headers like `### 2.6 Foo` but not `### 2.6.1 Foo` because the regex `### \d+\.\d+\s+` requires whitespace after the second number. Claims under `### 2.6.1` get lumped under the parent `### 2.6` subsection, producing incorrect claim IDs. This causes confusing behaviour when different subsections have similar claims. Fix: update the regex to handle sub-subsections. File: `src/verify/extract-claims.ts`.

## 4. Reduce review cycle overhead — auto-advance review marker for housekeeping-only commits
**Type**: improve
**Impact**: low
**Reasoning**: This shift had a high reactive ratio (80%) largely because every commit triggers a review cycle. The `autoCommitHousekeeping` function in setup.ts already auto-commits and advances the marker for housekeeping changes, but elf commits for explored candidates and critiques still trigger full review. Consider whether clean critiques (marked as resolved immediately) need a separate review cycle, or if the system could batch related operations to reduce review churn.

## 5. Add CHANGELOG.md
**Type**: doc-sync
**Impact**: low
**Reasoning**: Invariant 3.5 specifies "The CHANGELOG tracks user-facing changes in Keep a Changelog format." No CHANGELOG.md exists in the repo. This is a specified-only gap that should be straightforward to implement. File: `CHANGELOG.md`.
