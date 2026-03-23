# Archive old resolved findings

skill-type: health

## Context

There are 180 findings in `.shoe-makers/findings/`, including 107 critique files from 2026-03-21 and 2026-03-22. All are resolved. The directory is cluttered, making it harder to scan for active issues.

The protocol says findings should preserve the review trail — archiving (not deleting) satisfies this.

## What to build

1. Create directory `.shoe-makers/findings/archive/`
2. Move all `critique-2026-03-21-*.md` and `critique-2026-03-22-*.md` files into `archive/`
3. Move all resolved non-critique findings older than 2026-03-23 into `archive/` (check status first)
4. Verify that `countUnresolvedCritiques()` in `src/state/world.ts:96` still works — it scans `findings/` directory for `critique-*.md` files. After archival, it should find fewer files but the count of unresolved ones should be unchanged (0).

## Patterns to follow

- Use `git mv` for each file to preserve git history
- Keep today's findings (2026-03-23) in the active directory
- Only archive files that have `## Status\nResolved` matching the RESOLVED_PATTERN regex

## Tests to write

No new tests needed — this is a file organization change. Run `bun test` to confirm the `countUnresolvedCritiques` function still works correctly (it reads the findings directory).

## What NOT to change

- Do not delete any findings — archive only
- Do not modify source code
- Do not modify any finding content
- Do not archive today's (2026-03-23) findings
- Do not archive unresolved findings
