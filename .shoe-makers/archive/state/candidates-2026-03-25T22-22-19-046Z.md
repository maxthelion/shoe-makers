# Candidates

## 1. Write finding: insight 2026-03-25-001 is already addressed
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The insight `2026-03-25-001.md` (Quorum Sensing) describes a stuck state where the review-loop-breaker routes to explore when candidates exist. Inspection of `src/tree/default-tree.ts:39-41` shows `inReviewLoop()` already returns false when `hasCandidates || hasWorkItem`, and lines 49-51 and 61-63 suppress critiques and reviews similarly. The insight's core proposal is implemented. The insight file should be dismissed or updated to reflect this, and the evaluate-insight action should handle it. Writing a finding documents this for the next elf.

## 2. Add test for readWikiOverview frontmatter with no closing delimiter
**Type**: test
**Impact**: medium
**Reasoning**: `readWikiOverview` in `src/scheduler/format-action.ts:58` uses `content.replace(/^---[\s\S]*?---\n*/, "")` to strip frontmatter. The lazy quantifier `*?` means malformed frontmatter (opening `---` without closing `---`) would match just `---` and leave the rest. This edge case is untested. While not a bug per se (the regex behaves correctly), a test would document the expected behaviour and catch changes to the stripping logic.

## 3. Untrack remaining gitignored state files committed on this branch
**Type**: health
**Impact**: medium
**Reasoning**: Earlier this shift, ephemeral state files (assessment.json, last-action.md, next-action.md, previous-action-type) were committed to the branch despite `.shoe-makers/state/` being gitignored. They were later untracked, but `candidates.md` and `work-item.md` may still get force-added by the elf workflow. The auto-commit housekeeping in `src/scheduler/housekeeping.ts` should handle state files consistently with the gitignore. Consider adding a note to `.shoe-makers/known-issues.md` about this.

## 4. Archive the resolved quorum sensing insight
**Type**: health
**Impact**: low
**Reasoning**: The insight `2026-03-25-001.md` proposes a fix that's already implemented. The evaluate-insight action should dismiss it, but since we're in explore mode, we could write a finding noting it's resolved so the next evaluate-insight tick handles it correctly.
