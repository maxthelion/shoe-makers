# Push branch to remote after shift

skill-type: implement

## What to build

Add a `git push` step at the end of `src/shift.ts` so the human can review the shoemakers branch in the morning. The push should happen after the shift summary is written but before the exit, and should handle failures gracefully (log a warning, don't crash).

## Context

The wiki spec (`wiki/pages/branching-strategy.md`, lines 30-42) describes the branch lifecycle:
> ```
> 1am-6am: Behaviour tree ticks every 5 minutes
>   → agents commit to the branch
> 8am: Human reviews the branch
> ```

For the human to review the branch, it needs to be pushed to the remote. Currently `src/shift.ts` commits but never pushes.

The `src/setup.ts` already does `git fetch origin` (line 100), so the remote exists.

## What to change

### 1. Add push logic to `src/shift.ts`

After line 39 (`await prependShiftDashboard(repoRoot, summary);`), add:

```typescript
// Push branch to remote for human review
try {
  const branchName = execSync("git branch --show-current", { cwd: repoRoot, encoding: "utf-8" }).trim();
  execSync(`git push -u origin ${branchName}`, { cwd: repoRoot, stdio: "pipe" });
  console.log(`[shoe-makers] Pushed ${branchName} to origin.`);
} catch (err) {
  console.warn(`[shoe-makers] Failed to push branch: ${err instanceof Error ? err.message : err}`);
}
```

Import `execSync` from `child_process`.

### 2. Add tests in `src/__tests__/shift.test.ts`

If a shift test file exists, add a test. If not, this is tested by the manual `bun run shift` flow. The push is a side effect at the edge, so a simple integration note is sufficient.

Check if there's an existing test file first. If `src/__tests__/shift.test.ts` or similar exists, add tests there. If not, don't create a new test file for this — the feature is a 5-line edge-effect.

## Patterns to follow

- Error handling: catch and warn, don't crash (same pattern as `ensureBranch` in `setup.ts` lines 99-101)
- Use `execSync` for git operations (same as `setup.ts`)
- Push only once at shift end, not per tick

## What NOT to change

- Do NOT modify `src/setup.ts`
- Do NOT modify `src/scheduler/shift.ts`
- Do NOT modify wiki pages
- Do NOT modify `src/tree/evaluate.ts`
- Do NOT add retry logic — a single push attempt is sufficient

## Tests to write

- Only if an existing shift test file exists
- Verify the push runs after summary is written
