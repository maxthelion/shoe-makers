# Archive resolved 2026-03-23 findings

skill-type: health

## Context

There are 55+ findings files in `.shoe-makers/findings/` from today (2026-03-23), all with status "Resolved." The previous shift archived 125 findings from 2026-03-21 and 2026-03-22 into `.shoe-makers/findings/archive/` (commit cdaf891). The same cleanup should be done for today's resolved findings.

## What to do

1. Move all resolved findings from `.shoe-makers/findings/` to `.shoe-makers/findings/archive/`:
   - All `critique-2026-03-23-*.md` files (001 through 052)
   - `exclusion-list-stale-2026-03-23.md`
   - `invariants-stale-refs-2026-03-22.md`
   - `invariants-stale-skills-2026-03-23.md`
   - `shift-2026-03-23-session1.md`
   - `shift-2026-03-23-session2.md`

2. Use `git mv` for each file so git tracks the rename.

3. Do NOT move any file whose Status section does not contain "Resolved".

4. Run `bun test` to confirm nothing breaks (tests should not reference findings files).

## Pattern to follow

See commit cdaf891 for the previous archival. Same mechanical process: `git mv` each file to the archive directory.

## What NOT to change

- Do not modify any file contents — just move them
- Do not modify `src/`, `wiki/`, or `.shoe-makers/invariants.md`
- Do not archive files that are not resolved
