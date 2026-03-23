# Auto-commit Setup Housekeeping to Avoid Review Cycles

skill-type: implement

## Context

The setup script (`src/setup.ts`) performs two housekeeping operations that leave uncommitted changes:
1. **Archive resolved findings** — moves resolved `.md` files from `findings/` to `findings/archive/` (line 49-51)
2. **Append to shift log** — writes tick entries to `.shoe-makers/log/YYYY-MM-DD.md` (line 100-103)

These changes trigger the tree's `unverified-work` and `unreviewed-commits` conditions, creating a review cycle:
- Elf must commit the archive/log changes
- That commit needs adversarial review
- The review creates another commit
- That commit needs review... and so on

This wastes 2-4 ticks per cycle on mechanical housekeeping that requires no human or LLM judgment.

## What to Build

After the setup script performs archiving and writes the shift log entry, **auto-commit** those housekeeping changes and **update the last-reviewed-commit marker** so they don't trigger the review cycle.

### Implementation

In `src/setup.ts`, after the shift log is written (after line 103), add:

```typescript
// Auto-commit housekeeping changes (archive, shift log) so they don't
// trigger review cycles — these are mechanical, not elf-authored
await autoCommitHousekeeping(repoRoot);
```

Create a function `autoCommitHousekeeping` (in setup.ts or a new file):

```typescript
function autoCommitHousekeeping(repoRoot: string): void {
  // Check for unstaged changes in housekeeping paths only
  const status = execSync("git status --porcelain", { cwd: repoRoot, encoding: "utf-8" }).trim();
  if (!status) return;

  const housekeepingPaths = [".shoe-makers/findings/", ".shoe-makers/log/"];
  const lines = status.split("\n");
  const housekeepingChanges = lines.filter(line => {
    const path = line.slice(3); // strip status prefix
    return housekeepingPaths.some(p => path.startsWith(p));
  });

  if (housekeepingChanges.length === 0) return;
  if (housekeepingChanges.length !== lines.length) return; // Don't auto-commit if there are non-housekeeping changes

  // Stage and commit only housekeeping files
  for (const line of housekeepingChanges) {
    const path = line.slice(3);
    execSync(`git add "${path}"`, { cwd: repoRoot });
  }
  execSync('git commit -m "Auto-commit setup housekeeping (archive, shift log)"', { cwd: repoRoot });

  // Update the review marker so this commit doesn't trigger critique
  const head = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf-8" }).trim();
  writeFileSync(join(repoRoot, ".shoe-makers", "state", "last-reviewed-commit"), head);
}
```

### Key Design Decisions

1. **Only auto-commit if ALL changes are housekeeping** — if there are mixed changes (e.g., findings + code), don't auto-commit anything. Let the elf handle it.
2. **Update last-reviewed-commit** — this is the critical part. Without this, the auto-committed changes would still trigger the critique condition.
3. **Housekeeping paths** — only `.shoe-makers/findings/` (archive moves) and `.shoe-makers/log/` (shift log entries) are considered housekeeping. Everything else requires elf review.

### Patterns to Follow

- `execSync` is already used throughout setup.ts for git operations
- The `last-reviewed-commit` marker is a simple file write (see `src/state/world.ts:59`)
- Keep it simple — no need for a separate module, this is a setup-only concern

### Tests to Write

In `src/__tests__/setup.test.ts` or a new test file:

1. **Test that `autoCommitHousekeeping` commits when only housekeeping changes exist**
2. **Test that it does NOT commit when non-housekeeping changes are present**
3. **Test that it updates the last-reviewed-commit marker after committing**
4. **Test that it's a no-op when there are no changes**

### What NOT to Change

- Do not modify the behaviour tree — the conditions are correct, we're just preventing unnecessary triggers
- Do not modify `src/state/world.ts` — the `checkUnreviewedCommits` logic is correct
- Do not modify `src/skills/assess.ts` — archiving logic is correct
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Chosen over candidate 2 (verify invariant re-check) because the review cycle inefficiency is directly observable and wastes real ticks every session. Candidate 1 (arc test) is lower priority since it's test-only. Candidate 3 (CHANGELOG) is lower impact. Candidate 5 (test quality checker) is speculative. The cycle efficiency improvement has the highest productivity impact — each saved tick is 5 minutes of useful work reclaimed.
