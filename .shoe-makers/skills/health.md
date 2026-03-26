---
name: health
description: Improve code health scores by reducing complexity and duplication.
maps-to: health
risk: low
---

## When to apply

Code health score is below 70/100, indicating significant quality issues.

## Instructions

1. Identify the lowest-quality areas: high complexity, duplication, poor naming, large functions.
2. Pick one area to improve (don't try to fix everything at once).
3. Apply safe refactorings:
   - Extract helper functions from large functions
   - Consolidate duplicated logic
   - Rename unclear variables and functions
   - Split files that are too large
   - Remove dead code (zero references only)
4. Run `bun test` after each change to ensure nothing breaks.
5. Keep refactorings small and behaviour-preserving.

## Verification criteria

- `bun test` passes
- No behaviour changes (refactoring only)
- Code is measurably simpler (fewer lines per function, less duplication)

## Permitted actions

- Refactor source files in `src/`
- Extract new helper modules
- Remove dead code with zero references

## Validation

- `bun test passes`
- `no behaviour changes`
- `code is measurably simpler`

## Off-limits

- Do not change external interfaces or APIs
- Do not add new features during health improvement
- Do not modify tests to match refactored code (tests should still pass as-is)
- Do not remove code that has callers
