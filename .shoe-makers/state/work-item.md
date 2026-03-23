# Fix permission violation false positives from auto-commit housekeeping

skill-type: bug-fix

## Problem

The permission violation detection in `src/verify/detect-violations.ts` uses `git diff --name-only ${lastReviewed}..HEAD` to find all changed files since the last review. This range includes files changed by auto-commit housekeeping commits (shift log entries, archived findings), which are made by the setup script — not by the elf. This causes recurring false-positive permission violations (documented in critiques 128, 129, 130), wasting review ticks.

## Root Cause

`detectPermissionViolations()` at line 33 of `src/verify/detect-violations.ts`:
```typescript
const changedFilesRaw = execSync(`git diff --name-only ${lastReviewed}..HEAD`, {
```

This captures ALL file changes in the range, including those from commits with message `"Auto-commit setup housekeeping (archive, shift log)"` (see `src/setup.ts` line 171).

## What to Build

Modify `detectPermissionViolations()` to exclude files that were only changed by auto-commit housekeeping commits. The approach:

1. Instead of `git diff --name-only`, use `git log` to iterate commits in the range
2. Skip commits whose message starts with `"Auto-commit setup housekeeping"`
3. Collect changed files only from non-housekeeping commits
4. Run permission checks against this filtered list

### Implementation pattern

Replace the single `git diff` call (lines 33-36) with:

```typescript
// Get non-housekeeping commits in the range
const commitsRaw = execSync(
  `git log --format="%H %s" ${lastReviewed}..HEAD`,
  { cwd: repoRoot, encoding: "utf-8" }
).trim();

if (!commitsRaw) return [];

const elfCommitHashes = commitsRaw
  .split("\n")
  .filter(line => !line.includes("Auto-commit setup housekeeping"))
  .map(line => line.split(" ")[0])
  .filter(Boolean);

if (elfCommitHashes.length === 0) return [];

// Get changed files only from elf commits
const changedFiles = new Set<string>();
for (const hash of elfCommitHashes) {
  const files = execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, {
    cwd: repoRoot, encoding: "utf-8"
  }).trim();
  if (files) files.split("\n").forEach(f => changedFiles.add(f));
}
```

Then pass `[...changedFiles]` to `checkPermissionViolations()`.

## Relevant Files

- `src/verify/detect-violations.ts` — the file to modify (47 lines)
- `src/verify/permissions.ts` — permission checking logic (don't modify)
- `src/setup.ts:171` — the auto-commit message string
- `src/__tests__/violation-findings.test.ts` — existing violation tests

## Tests to Write

Add tests in a new or existing test file for `detect-violations`:
1. Test that housekeeping-only commits produce zero violations
2. Test that elf commits mixed with housekeeping commits only check elf-authored files
3. Test that a range with no housekeeping commits works as before

## What NOT to Change

- `src/verify/permissions.ts` — the permission model is correct
- `src/setup.ts` — the auto-commit message is fine
- Any wiki pages
- `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 was chosen over the others because:
- **Highest practical impact**: This bug wastes 1-2 ticks per cycle resolving false positives. Fixing it saves real elf time every shift.
- **Root cause fix**: Unlike the other candidates (improvements, doc updates), this eliminates a known, recurring bug.
- **Well-scoped**: Single file change with clear before/after behaviour. Low risk of regression.
- Candidates #2 (shift summary) and #5 (dedup housekeeping) are good future work but less urgent.
