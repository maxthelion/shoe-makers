skill-type: health

# Make typecheck work without npm registry access

## Context

The `tsconfig.json` has `"types": ["bun-types"]` which requires `@types/bun` in node_modules. When npm is blocked (air-gapped, restricted CI), `tsc --noEmit` fails with "Cannot find type definition file for 'bun-types'" and `runTypecheck()` returns `null`. This means the system has zero type safety signal.

Bun natively understands its own types — `bun build` and `bun test` work fine without `@types/bun`. The issue is that we're using `npx tsc --noEmit` which requires the explicit type definitions.

## What to change

### File: `tsconfig.json`

Remove the `"types": ["bun-types"]` line. Bun's own type checker doesn't need this — it's only needed for standalone tsc. Without it, tsc will use default type resolution which won't fail catastrophically in restricted environments.

Change from:
```json
"types": ["bun-types"],
```

To: remove this line entirely.

### File: `src/skills/assess.ts`

The `runTypecheck` function currently runs `npx tsc --noEmit`. This should still work after removing the types config — tsc will just not know about bun-specific APIs. But since we're a bun project, consider changing the check to see if tsc is even available, and if not, skip gracefully (return null).

The existing "Cannot find type definition file" check in the catch block (line 53) can remain as a safety net, but should be less likely to trigger after removing the types config.

No other changes needed to this function.

## What to test

Run `bun test` to confirm all existing tests still pass after the tsconfig change. The typecheck-related tests in `src/__tests__/assess.test.ts` should still work — they test the `runTests` function, not `runTypecheck` directly.

## What NOT to change

- Do not modify `src/tree/default-tree.ts`
- Do not modify `.shoe-makers/invariants.md`
- Do not change the `runTypecheck` function's return type or interface

## Decision Rationale

Candidate #1 was chosen because it's a single-line config change with high impact — it restores type safety signal to the assessment. The README update (#2) is lower priority since it doesn't affect system behaviour.
