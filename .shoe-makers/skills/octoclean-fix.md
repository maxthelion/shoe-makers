---
name: octoclean-fix
description: Fix code health issues identified by octoclean — reduce complexity, improve structure.
maps-to: octoclean-fix
risk: medium
---

## When to apply

The assessment shows a health score below threshold, and octoclean has identified specific files with poor scores.

## Instructions

1. Read the assessment to find the worst files by health score.
2. Run `npx tsx node_modules/octoclean/src/cli/index.ts scan` to get detailed metrics.
3. For each file, identify the primary issue: cyclomatic complexity, cognitive complexity, file length, or duplication.
4. Apply targeted fixes:
   - High cyclomatic complexity → extract helper functions, simplify conditionals
   - High cognitive complexity → reduce nesting, use early returns
   - Long files → split into focused modules
   - Duplication → consolidate into shared utilities
5. Run `bun test` to confirm nothing broke.
6. Commit with a clear message explaining what was improved and why.

## Verification criteria

- Health score does not regress (and ideally improves)
- All tests pass
- Changes are focused on the identified files
- Refactoring preserves behaviour

## Permitted actions

- Modify source files in `src/`
- Create new helper/utility files if needed for extraction

## Validation

- `health score does not regress`
- `all tests pass`
- `refactoring preserves behaviour`

## Off-limits

- Do not modify test files — only refactor implementation
- Do not change public APIs without updating callers
- Do not modify high-fan-in files without checking all import sites
- Do not add external dependencies
