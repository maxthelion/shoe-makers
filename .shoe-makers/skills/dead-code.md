---
name: dead-code
description: Remove dead code — unused exports, unreachable branches, stale modules.
maps-to: dead-code
risk: low
---

## When to apply

Code analysis reveals unused exports, unreachable code paths, or modules with no importers.

## Instructions

1. Identify dead code candidates:
   - Exports not imported anywhere
   - Functions/variables only referenced in their own file but not exported
   - Conditional branches that can never execute
   - Deprecated types or interfaces with no remaining usage
2. Verify each candidate is truly dead — check all files for references.
3. Remove the dead code.
4. Run `bun test` to confirm nothing depended on it.
5. Commit with a message listing what was removed and why it was dead.

## Verification criteria

- All tests pass after removal
- No import errors introduced
- Each removal is justified (truly unreferenced)

## Permitted actions

- Delete dead code from source files in `src/`
- Remove stale test files if they test removed features

## Validation

- `bun test passes after removal`
- `no import errors introduced`
- `each removal is justified`

## Off-limits

- Do not remove code that is referenced elsewhere
- Do not remove types that are part of public interfaces
- Do not modify wiki or documentation as part of this action
