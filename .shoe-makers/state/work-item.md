skill-type: health

# Skip review for shoe-makers-only commits (findings, insights, log)

## Context

The `checkUnreviewedCommits` function in `src/state/world.ts` already filters out:
1. Auto-commit housekeeping (via commit message prefix check)
2. State-file-only commits (files only in `.shoe-makers/state/`)

But commits that only touch `.shoe-makers/findings/`, `.shoe-makers/insights/`, or `.shoe-makers/log/` still trigger adversarial review. These are low-risk orchestration outputs — a critique writing a finding, an innovate action writing an insight, an evaluate-insight deleting an insight. Reviewing these mechanical actions consumes ~50% of shift ticks without adding value.

## What to change

### File: `src/verify/detect-violations.ts`

The `getElfChangedFiles` function (line 65-100) currently checks:
```typescript
const STATE_PREFIX = ".shoe-makers/state/";
// ...
return files.length === 0 || !files.every(f => f.startsWith(STATE_PREFIX));
```

**Change**: Expand the state-only check to also include other `.shoe-makers/` subdirectories that are orchestration output, not source code. Replace the single `STATE_PREFIX` with an array of prefixes:

```typescript
const ORCHESTRATION_PREFIXES = [
  ".shoe-makers/state/",
  ".shoe-makers/findings/",
  ".shoe-makers/insights/",
  ".shoe-makers/log/",
  ".shoe-makers/archive/",
];
```

Then change the filter to:
```typescript
return files.length === 0 || !files.every(f => ORCHESTRATION_PREFIXES.some(p => f.startsWith(p)));
```

This means commits that ONLY touch `.shoe-makers/` orchestration dirs are treated as "not elf work" and don't trigger review. Commits that touch `src/`, `wiki/`, or other real code will still trigger review.

### File: `src/state/world.ts`

No changes needed — `checkUnreviewedCommits` (line 59-97) already calls `getElfChangedFiles` and advances the review marker when no elf files are found.

## What to test

Add tests in `src/__tests__/detect-violations.test.ts`:

1. A commit touching only `.shoe-makers/findings/critique-xxx.md` should be filtered (not returned by `getElfChangedFiles`)
2. A commit touching only `.shoe-makers/insights/xxx.md` should be filtered
3. A commit touching `.shoe-makers/findings/xxx.md` AND `src/foo.ts` should NOT be filtered (mixed commit)
4. Existing tests for state-only and housekeeping filtering should still pass

Follow the existing test patterns in that file — use the `createTestRepo` helper.

## What NOT to change

- Do not modify the tree structure in `default-tree.ts`
- Do not modify `autoCommitHousekeeping` in `setup.ts` — that handles a different case
- Do not change the permission system in `verify/permissions.ts`
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 was chosen because:
- **Highest impact**: 64% reactive ratio means most of the shift is wasted on reviewing mechanical actions
- **Low risk**: The change extends an existing, tested pattern (state-file filtering) to more `.shoe-makers/` paths
- **Root cause**: The other candidates address symptoms (typecheck, process loops, Wikipedia fallback) but this one addresses the structural reason the shift spends more time reviewing than working
- Candidate #2 (typecheck) is valid but lower priority — the tree already handles `null` correctly
- Candidate #3 (loop detection) would be good follow-up work after reducing the review volume
