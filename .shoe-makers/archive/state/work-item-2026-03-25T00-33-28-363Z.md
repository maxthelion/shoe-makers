# Skip review for state-file-only commits (orchestration artifacts)

skill-type: implement

## Original insight

During this shift, ~80% of actions were reactive reviews. The explore→prioritise→execute cycle requires 6 actions (3 proactive + 3 reviews) for one unit of work. Candidates.md and work-item.md are transient orchestration artifacts that get consumed — reviewing them adds overhead without meaningful safety benefit.

## Improved proposal

Extend the existing `getElfChangedFiles` function to also filter out commits that only modify `.shoe-makers/state/` files (candidates.md, work-item.md). These are orchestration artifacts, not elf-authored code. The `checkUnreviewedCommits` condition already auto-advances the review marker for housekeeping-only commits — the same pattern works for state-file-only commits.

## What to build

### 1. Update `getElfChangedFiles` in `src/verify/detect-violations.ts`

Currently filters commits by commit message prefix (`Auto-commit setup housekeeping`). Add a second filter: if ALL changed files in a commit are under `.shoe-makers/state/`, treat it as an orchestration commit, not an elf-authored commit.

The function at line 50 currently filters by commit message:
```typescript
const elfCommitHashes = commitsRaw
  .split("\n")
  .filter(line => {
    const subject = line.substring(line.indexOf(" ") + 1);
    return !subject.startsWith(HOUSEKEEPING_PREFIX);
  })
```

After filtering by message, also check each remaining commit's changed files. If all changed files are under `.shoe-makers/state/`, exclude it:

```typescript
// For each remaining commit, check if ALL changed files are state-only
const realElfCommits = elfCommitHashes.filter(hash => {
  const files = execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, {
    cwd: repoRoot, encoding: "utf-8"
  }).trim().split("\n").filter(Boolean);
  return !files.every(f => f.startsWith(".shoe-makers/state/"));
});
```

### 2. Add tests in `src/__tests__/`

Add tests verifying:
- Commits that only change `.shoe-makers/state/candidates.md` are not considered elf-authored
- Commits that only change `.shoe-makers/state/work-item.md` are not considered elf-authored
- Commits that change BOTH state files AND source files ARE considered elf-authored
- The existing housekeeping commit filtering still works

Look at existing tests for `getElfChangedFiles` in `src/__tests__/` to follow the pattern.

### 3. Integration: `checkUnreviewedCommits` already handles this

The `checkUnreviewedCommits` function in `src/state/world.ts` already calls `getElfChangedFiles` and auto-advances the review marker when no elf files are found (lines 80-93). No changes needed there — just fixing the filter function propagates the behaviour.

## What NOT to change

- Do NOT modify the behaviour tree or tree evaluator
- Do NOT change `checkUnreviewedCommits` — it already delegates correctly
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the housekeeping commit filter — add to it, don't replace it
- Do NOT change the permission violation detector — it should still flag state-file changes correctly for the actions that ARE supposed to be reviewed

## Patterns to follow

- Follow the existing `HOUSEKEEPING_PREFIX` pattern for commit filtering
- Use `execSync` for git commands like the rest of the file
- Add a comment explaining why state-file commits are excluded

## Verification

1. `bun test` passes
2. After a cycle of explore→prioritise, the tree should skip directly to execute without triggering a review in between
