# Rename misleading shift test title

skill-type: test

## Context

Critique-211 flagged that `src/__tests__/shift.test.ts` has a test titled "returns sleep when tree produces no action" (line ~157) that doesn't actually test the sleep path. The default tree always falls through to "explore", so the test actually exercises onTick with a single-tick limit (maxTicks: 1).

## What to build

In `src/__tests__/shift.test.ts`, rename the test at approximately line 157:

**From**: `"returns sleep when tree produces no action"`
**To**: `"calls onTick callback with single tick"`

Also remove the misleading comments about the sleep path (the long block of comments explaining why the sleep path can't be tested). Replace with a brief comment like:
```typescript
// The default tree always returns explore, so the sleep path is unreachable.
// This test verifies onTick works with a single-tick shift.
```

## What NOT to change

- Do not modify source files
- Do not delete or skip any tests
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 was chosen because:
- It addresses an advisory finding from critique-211
- It's a quick, low-risk fix that improves test readability
- Candidates #2 (doc-sync) turned out to already be accurate in the wiki
- Candidate #3 (permission violation tests) turned out to already have full coverage
- Candidate #4 (test helper consolidation) is lower priority cosmetic work
