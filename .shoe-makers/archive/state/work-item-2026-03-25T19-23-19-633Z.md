# Update CHANGELOG.md with recent shift improvements

skill-type: doc-sync

## Context

`CHANGELOG.md` has duplicate entries and references the deleted `agent-work-execution.md` plan page. This shift made several improvements that should be logged.

## What to change

1. Remove the reference to `agent-work-execution.md` on line 12 (file was deleted)
2. Remove duplicate entries (lines 40-54 repeat items from lines 34-39)
3. Add new entries for this shift's work under `### Changed`:
   - Refactored `setup.ts` — extracted `main()` into focused helper functions (`handleWorkingHoursCheck`, `runAssessmentPhase`, `evaluateTreePhase`, `writeActionAndLog`)
   - Removed unused `Blackboard.priorities` and `Blackboard.verification` fields from types.ts
   - Fixed `tick-types.md` wiki tree diagram — added missing `[partial work?]` node
   - Archived completed `agent-work-execution.md` plan page
   - Added `.codehealth/` to `.gitignore` — prevents octoclean scan artifacts from triggering uncommitted changes detection

## Files to modify

- `CHANGELOG.md`

## What NOT to change

- Do NOT modify source files
- Do NOT modify wiki pages
- Do NOT modify invariants

## Decision Rationale

CHANGELOG update was chosen because it helps the human reviewer understand what happened this shift. The other candidates (minor style consistency in behaviour-tree.md, init template change) are lower impact.
