# Skip housekeeping-only review cycles in the tree

skill-type: bug-fix

## Problem

The `checkUnreviewedCommits()` function in `src/state/world.ts:58-87` returns `true` whenever HEAD is ahead of `last-reviewed-commit`, even if all commits are auto-commit housekeeping. This causes the tree to route to `critique` for empty reviews, wasting ticks (observed in critiques 138, 140, 143, 144, 146, 149, 151).

## What to do

Modify `checkUnreviewedCommits()` to use `getElfChangedFiles()` from `src/verify/detect-violations.ts` (already exported) to filter out housekeeping commits. If no elf-authored files changed, return `false`.

### Implementation

In `src/state/world.ts`, replace the `git log ${lastReviewed}..HEAD --oneline` check (lines 79-84) with:

```typescript
import { getElfChangedFiles } from "../verify/detect-violations";

// Instead of just checking if commits exist, check if elf-authored changes exist
const elfFiles = getElfChangedFiles(repoRoot, lastReviewed);
return elfFiles.length > 0;
```

Keep the fallback logic for when no marker file exists unchanged.

### Important: also update the review marker

When `checkUnreviewedCommits` returns false (only housekeeping), the `last-reviewed-commit` marker should still be updated to HEAD to prevent re-checking the same housekeeping commits. Add this to `setup.ts` — when the tree doesn't route to critique AND there are commits ahead of the marker, advance the marker.

## Files to modify

- `src/state/world.ts` — modify `checkUnreviewedCommits()`
- `src/setup.ts` — advance review marker when skipping housekeeping

## Files NOT to modify

- `src/verify/detect-violations.ts` — already has `getElfChangedFiles`
- `.shoe-makers/invariants.md`

## Tests

Update `src/__tests__/world.test.ts` to verify that housekeeping-only commit ranges return `false`.

## Decision Rationale

Candidate #4 chosen because:
- Highest immediate impact: eliminates 40%+ of wasted ticks (empty review cycles)
- Builds on existing `getElfChangedFiles` infrastructure
- Makes the system noticeably more efficient for humans observing the shift log
