# Update CHANGELOG with today's improvements

skill-type: doc-sync

## What to do

Add entries to the `[Unreleased]` section of `CHANGELOG.md` for today's work:

### Fixed
- Permission violation detection now filters out auto-commit housekeeping commits — prevents false positives from shift log and archive changes (`src/verify/detect-violations.ts`)
- Executor role can now write test files — TDD enforcement handled by adversarial review instead of file-level permissions (`src/verify/permissions.ts`)

### Pattern

Follow the existing Keep a Changelog format. Add a `### Fixed` section under `## [Unreleased]`, after the existing `### Added` section. Each entry should be one line describing the change.

### Files to modify

- `CHANGELOG.md` — add new entries

### Files NOT to modify

- Any source code
- `.shoe-makers/invariants.md`
- Wiki pages

## Decision Rationale

Candidate #3 (CHANGELOG) chosen because:
- Quick, focused task with clear deliverable
- Invariant 3.5 requires keeping CHANGELOG current
- Two significant fixes from today's shift need documenting
- Higher priority than shift summary (needs more design work) or health improvements
