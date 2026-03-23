# Update CHANGELOG to reflect all 9 skills

skill-type: doc-sync

## Context

The CHANGELOG.md `[Unreleased]` section under "Added" says:
> 5 skill markdown files: fix-tests, implement, test-coverage, doc-sync, health

But `.shoe-makers/skills/` now contains 9 skill files:
- fix-tests.md
- implement.md
- test-coverage.md
- doc-sync.md
- health.md
- bug-fix.md (added later)
- dead-code.md (added later)
- dependency-update.md (added later)
- octoclean-fix.md (added later)

The wiki page `wiki/pages/skills.md` lists all 9 skills as "Implemented Skills", confirming these are all current.

## What to change

In `CHANGELOG.md`, update the line:
```
- 5 skill markdown files: fix-tests, implement, test-coverage, doc-sync, health
```
to:
```
- 9 skill markdown files: fix-tests, implement, test-coverage, doc-sync, health, bug-fix, dead-code, dependency-update, octoclean-fix
```

Also archive the 3 resolved critique findings:
- Move `.shoe-makers/findings/critique-2026-03-23-063.md` to `.shoe-makers/findings/archive/`
- Move `.shoe-makers/findings/critique-2026-03-23-064.md` to `.shoe-makers/findings/archive/`
- Move `.shoe-makers/findings/critique-2026-03-23-065.md` to `.shoe-makers/findings/archive/`

## Tests

Run `bun test` to confirm nothing breaks. No new tests needed for doc changes.

## Do NOT change

- Any files in `src/`
- Any files in `wiki/`
- `.shoe-makers/invariants.md`
