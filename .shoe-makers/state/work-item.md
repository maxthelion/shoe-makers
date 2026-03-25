# Remove unused backward-compat re-exports from setup.ts

skill-type: dead-code

## What to do

Remove line 159 of `src/setup.ts`:
```
export { isAllHousekeeping, HOUSEKEEPING_PATHS } from "./scheduler/housekeeping";
```

This re-export is completely unused — no file imports these symbols from setup. The comment says "Re-export for backward compatibility with existing test imports" but `src/__tests__/setup.test.ts` doesn't use them.

## Verification

1. `bun test` must pass
2. `grep -r "from.*setup" src/ | grep -E "isAllHousekeeping|HOUSEKEEPING_PATHS"` should return nothing

## Decision Rationale

Picked #1 (dead re-exports) as a clean, zero-risk dead code removal.
