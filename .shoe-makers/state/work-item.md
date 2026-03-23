# Deduplicate RESOLVED_PATTERN — import from world.ts

skill-type: octoclean-fix

## Context

The auto-archive feature (commit b6ec1d8) introduced a duplicate `RESOLVED_PATTERN` regex in `src/skills/assess.ts:77`. The same pattern is already exported from `src/state/world.ts:94`. Critique-101 flagged this as tech debt.

## What to change

In `src/skills/assess.ts`:

1. **Remove** the local `RESOLVED_PATTERN` definition (line 77):
   ```typescript
   const RESOLVED_PATTERN = /^## Status\s*\n\s*Resolved\.?\s*$/mi;
   ```

2. **Add** an import from `src/state/world.ts`:
   ```typescript
   import { RESOLVED_PATTERN } from "../state/world";
   ```

That's it. One line removed, one import added.

## Tests

No new tests needed — existing tests in `src/__tests__/critique-detection.test.ts` already verify `RESOLVED_PATTERN` from `world.ts`, and `src/__tests__/archive.test.ts` verifies `archiveResolvedFindings` end-to-end. Run `bun test` to confirm nothing breaks.

## What NOT to change

- Don't move `RESOLVED_PATTERN` out of `world.ts` — it's already correctly placed and exported there
- Don't modify `archiveResolvedFindings` logic — only the import source changes
- Don't change `countUnresolvedCritiques` — it already uses the `world.ts` version
