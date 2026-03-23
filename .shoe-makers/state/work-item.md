# Split init-skill-templates.ts into smaller files

skill-type: health

## Context

`src/init-skill-templates.ts` scores 92/100 (worst in codebase) due to being a 378-line monolithic file of 9 template string constants. The file header says "Split from init-templates.ts to keep file sizes manageable" — it needs to be split further.

## What to do

Split `src/init-skill-templates.ts` into three smaller files by category:

### File 1: `src/init-skill-templates-work.ts` (~170 lines)
Medium-risk skills that modify source code for features/fixes:
- `IMPLEMENT_SKILL` (lines 6-46)
- `BUG_FIX_SKILL` (lines 251-290)
- `OCTOCLEAN_FIX_SKILL` (lines 207-249)
- `DEPENDENCY_UPDATE_SKILL` (lines 333-378)

### File 2: `src/init-skill-templates-quality.ts` (~125 lines)
Low-risk skills that refactor or clean up source:
- `FIX_TESTS_SKILL` (lines 48-85)
- `HEALTH_SKILL` (lines 163-205)
- `DEAD_CODE_SKILL` (lines 292-331)

### File 3: `src/init-skill-templates-docs.ts` (~80 lines)
Low-risk skills that only touch tests or docs (not source):
- `TEST_COVERAGE_SKILL` (lines 87-124)
- `DOC_SYNC_SKILL` (lines 126-161)

### Then update `src/init.ts` imports (lines 10-20)

Change:
```typescript
import {
  IMPLEMENT_SKILL,
  FIX_TESTS_SKILL,
  TEST_COVERAGE_SKILL,
  DOC_SYNC_SKILL,
  HEALTH_SKILL,
  OCTOCLEAN_FIX_SKILL,
  BUG_FIX_SKILL,
  DEAD_CODE_SKILL,
  DEPENDENCY_UPDATE_SKILL,
} from "./init-skill-templates";
```

To:
```typescript
import {
  IMPLEMENT_SKILL,
  BUG_FIX_SKILL,
  OCTOCLEAN_FIX_SKILL,
  DEPENDENCY_UPDATE_SKILL,
} from "./init-skill-templates-work";
import {
  FIX_TESTS_SKILL,
  HEALTH_SKILL,
  DEAD_CODE_SKILL,
} from "./init-skill-templates-quality";
import {
  TEST_COVERAGE_SKILL,
  DOC_SYNC_SKILL,
} from "./init-skill-templates-docs";
```

### Finally, delete `src/init-skill-templates.ts`

## Patterns to follow

- Same style as existing `src/init-templates.ts` — exported const template strings
- Each file should have a brief JSDoc comment explaining its category
- No logic changes — purely moving constants between files

## What NOT to change

- Do not modify any template string content
- Do not modify `src/init-templates.ts` (the non-skill templates)
- Do not modify wiki or `.shoe-makers/invariants.md`
- Do not modify test files

## Verification

- `bun test` passes (all 496 tests)
- `bun run typecheck` passes
- `src/init-skill-templates.ts` no longer exists
- Three new files exist with correct exports
- `src/init.ts` imports from the new files
