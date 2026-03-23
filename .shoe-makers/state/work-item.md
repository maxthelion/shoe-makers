# Fix Auto-Commit Review Marker to Not Skip Code Reviews

skill-type: bug-fix

## Context

`autoCommitHousekeeping` in `src/setup.ts:147-178` updates `last-reviewed-commit` to HEAD after auto-committing. This can skip review of code commits: if an elf commits code, then setup auto-commits a shift log entry, the marker advances past the unreviewed code commit.

## The Bug

Consider this sequence:
1. Previous `last-reviewed-commit` = commit A
2. Elf commits code change = commit B (unreviewed)
3. Setup runs, auto-commits shift log = commit C
4. `autoCommitHousekeeping` sets marker to commit C
5. Now commits B and C are both "reviewed" — but B was never reviewed!

## What to Fix

Before auto-committing, read the current `last-reviewed-commit` marker. After auto-committing, only advance the marker by exactly one commit (the auto-commit). If there were unreviewed commits BEFORE the auto-commit, they should still be unreviewed.

### Implementation

In `autoCommitHousekeeping` (`src/setup.ts:147-178`):

```typescript
// Read the current marker BEFORE committing
const markerPath = join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit");
let previousMarker: string | null = null;
try {
  previousMarker = readFileSync(markerPath, "utf-8").trim();
} catch {}

// ... (stage and commit) ...

const head = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf-8" }).trim();

// Only update marker if the auto-commit is the ONLY unreviewed commit
// (i.e., the previous marker points to the parent of the auto-commit)
const parentOfHead = execSync("git rev-parse HEAD~1", { cwd: repoRoot, encoding: "utf-8" }).trim();
if (previousMarker === parentOfHead) {
  writeFileSync(markerPath, head);
}
```

This way, if there are unreviewed code commits between the marker and the auto-commit, the marker stays put and the critique cycle will still happen for those commits.

### Tests to Add

In `src/__tests__/auto-commit-housekeeping.test.ts`, these are logic tests that don't require git:

No new pure function tests needed — the fix is in the git integration layer. The existing `isAllHousekeeping` tests still apply. The behavioral fix can be verified by running setup and checking the marker value.

### What NOT to Change

- Do not modify `isAllHousekeeping` — it's correct
- Do not modify the behaviour tree
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

This is a bug-fix for a feature just implemented. The review marker skip is a correctness issue — it can cause code changes to bypass adversarial review, which undermines the quality assurance system. This takes priority over all other candidates because it affects the integrity of the review process.
