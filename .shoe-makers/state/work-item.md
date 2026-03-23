# Archive resolved critique findings

skill-type: health

## Context

There are 7 resolved critique findings in `.shoe-makers/findings/`. All have `## Status\nResolved.` markers. They inflate the findings count shown by setup (currently 7), making it hard to spot new genuine issues.

## What to do

1. Move all resolved critique files from `.shoe-makers/findings/` to `.shoe-makers/findings/archive/`
2. Use `git mv` for each file so git tracks the move
3. Verify the findings count drops to 0 after archiving

## Files to move

- critique-2026-03-23-079.md through critique-2026-03-23-085.md (7 files)

## What NOT to change

- Do not modify the content of any critique file
- Do not touch any files in `src/`, `wiki/`, or `.shoe-makers/invariants.md`
- Do not delete files — move them to archive

## Verification

- `ls .shoe-makers/findings/critique-*.md` should return no results
- `ls .shoe-makers/findings/archive/critique-*.md` should show the moved files
