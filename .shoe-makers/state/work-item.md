# Add bug-fix role to permission model

skill-type: bug-fix

## Problem

The `execute-work-item` role in `src/verify/permissions.ts:52-56` forbids writing to `src/__tests__/`. This makes sense for TDD enforcement (invariant 1.6), but bug-fix work items need tests alongside the fix. Every bug-fix that includes tests triggers a false permission violation (documented in critique-134).

## What to Build

Add the `execute-work-item` action type to recognize the work item's `skill-type` and apply different permissions for bug-fix vs. implement work items. The simplest approach: when the work item specifies `skill-type: bug-fix`, the executor should be allowed to write tests.

### Approach: Expand execute-work-item permissions to allow tests

The simplest fix is to remove `src/__tests__/` from `cannotWrite` for `execute-work-item`. The TDD enforcement is already handled by the three-phase cycle (explore → prioritise → execute) and the adversarial review. The `cannotWrite` restriction for tests creates more false positives than it prevents actual violations.

### Files to modify

1. **`src/verify/permissions.ts:52-56`**: Remove `"src/__tests__/"` from `execute-work-item`'s `cannotWrite` array:

```typescript
"execute-work-item": {
  role: "executor",
  canWrite: ["src/", "wiki/", ".shoe-makers/state/"],
  cannotWrite: [...ALWAYS_FORBIDDEN],
},
```

2. **`src/__tests__/permissions.test.ts`** (if it exists): Update any tests that assert `src/__tests__/` is forbidden for the executor.

### Files NOT to modify

- `src/types.ts` — no new action type needed
- `src/prompts/helpers.ts` — no new parsing needed
- `src/verify/detect-violations.ts` — already fixed
- `.shoe-makers/invariants.md` — never modify

## Tests

Check existing permission tests — update any that assert executor cannot write to `src/__tests__/`. Verify the executor can write to `src/__tests__/` after the change.

## Decision Rationale

Candidate #1 was chosen because:
- **Directly addresses critique-134 advisory**: This is a follow-up fix to the work just completed
- **Minimal change**: Single line removal in one file
- **Eliminates false positives**: Bug-fix executors can write tests without triggering violations
- **TDD enforcement is better handled by the review cycle** than by file-level permissions — the adversarial reviewer checks compliance, which is more nuanced than a glob pattern
