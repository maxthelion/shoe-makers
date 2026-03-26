skill-type: health

# Isolate checkUnreviewedCommits tests in world.test.ts to use temp git repos

## Wiki Spec

From `wiki/pages/verification.md` (lines 39-48): Tests should verify actual behaviour. From `wiki/pages/architecture.md`: The behaviour tree evaluates against world state including unreviewed commits detection. Tests for this feature should be reliable and not pollute the real repo state.

## Current Code

`src/__tests__/world.test.ts` (health score 88, worst file), lines 83-172:

The `checkUnreviewedCommits` describe block has 5 tests that write to the actual repo's `.shoe-makers/state/last-reviewed-commit` file. A fragile beforeEach/afterEach pattern saves and restores the marker:

- Lines 84-86: Hardcodes `repoRoot = process.cwd()` and derives markerPath
- Lines 88-109: beforeEach saves marker, afterEach restores it (27 LOC of guard boilerplate)
- Lines 111-118: Test "returns false when marker points to HEAD" — writes HEAD hash to real repo marker
- Lines 120-141: Test "returns true when elf-authored commits exist after marker" — finds real src-touching commit, writes its parent as marker
- Lines 143-149: Test "returns true when marker contains invalid content" — writes `"; rm -rf /"` to real repo marker
- Lines 151-159: Test "returns false for non-git directory" — already uses temp dir (good)
- Lines 161-171: Test "accepts short hash (7 chars) as valid marker" — writes short hash to real repo marker

The function under test (`src/state/world.ts` lines 59-97, `checkUnreviewedCommits`) takes a `repoRoot` parameter and reads `{repoRoot}/.shoe-makers/state/last-reviewed-commit`. It also runs git commands with `cwd: repoRoot`. So it can work with any git repo that has the right directory structure.

## What to Build

Refactor the `checkUnreviewedCommits` describe block to use isolated temp git repos:

1. Create a helper function `createTempGitRepo()` that:
   - Creates a temp directory with `mkdtemp`
   - Initializes a git repo (`git init`)
   - Creates an initial commit (`git commit --allow-empty -m 'init'`)
   - Creates `.shoe-makers/state/` directory
   - Returns the temp directory path

2. For tests that need commits touching `src/`:
   - Create a file in `src/` subdirectory, add and commit it
   - This gives a commit that `getElfChangedFiles` will detect

3. Rewrite the 4 tests that currently use `process.cwd()`:
   - "returns false when marker points to HEAD" — create temp repo, write HEAD hash to marker, check returns false
   - "returns true when elf-authored commits exist after marker" — create temp repo with 2+ commits (second touching src/), write first commit as marker, check returns true
   - "returns true when marker contains invalid content" — create temp repo, write invalid content to marker, check returns true
   - "accepts short hash as valid marker" — create temp repo, write short hash to marker, check returns boolean

4. Remove the beforeEach/afterEach guards entirely (no longer needed)

5. Keep the existing "returns false for non-git directory" test unchanged (it already uses temp dir)

**Important**: Use `git -c commit.gpgsign=false commit` for commits in temp repos (matches the pattern already used at line 48 of the file).

## Patterns to Follow

Follow the existing temp git repo pattern at lines 44-55 of `world.test.ts`:
```typescript
const tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-..."));
try {
  execSync("git init", { cwd: tempDir, stdio: "pipe" });
  execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: tempDir, stdio: "pipe" });
  // ... test logic ...
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
```

Also follow the pattern in lines 174-184 for temp directory lifecycle with beforeEach/afterEach.

## Tests to Write

No new tests — this is a refactor of existing tests. All 5 tests in the describe block must pass with the same assertions. The test count should remain 51 for world.test.ts.

Verify: `bun test src/__tests__/world.test.ts` should report 51 tests passing.

## What NOT to Change

- Do NOT modify `src/state/world.ts` (the function under test)
- Do NOT change other describe blocks in world.test.ts
- Do NOT modify test-utils.ts
- Do NOT touch `.shoe-makers/invariants.md`
- Do NOT change the test assertions — only change how the test environment is set up

## Decision Rationale

Candidate 1 chosen because:
- **Highest health impact**: world.test.ts is the worst file at 88
- **Real reliability risk**: If tests crash mid-run, the repo's `last-reviewed-commit` marker gets corrupted
- **Proven pattern**: The file already has temp git repo patterns at lines 44-55 that work well
- Candidates 2 and 3 are lower priority (setup.test.ts is only score 91, reactive test expansion is low value)
