# Candidates

## 1. CLAUDE.md project structure is outdated
**Type**: doc-sync
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: CLAUDE.md's project structure section lists only `types.ts`, `tree/`, `scheduler/`, `skills/`, `verify/`, and `__tests__/`. The actual `src/` directory also contains `config/`, `creative/`, `log/`, `state/`, `utils/`, plus 12 top-level files (`index.ts`, `init.ts`, `prompts.ts`, `setup.ts`, `shift.ts`, `task.ts`, `schedule.ts`, `run-init.ts`, and the init-template files). This is the primary onboarding doc for new elves. File: `CLAUDE.md` lines covering project structure.

## 2. CHANGELOG lists only 5 skills but 9 exist
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: CHANGELOG.md says "5 skill markdown files: fix-tests, implement, test-coverage, doc-sync, health" but `.shoe-makers/skills/` now contains 9 skills (also: bug-fix, dead-code, dependency-update, octoclean-fix). The 4 additional skills were added but CHANGELOG was not updated. File: `CHANGELOG.md`.

## 3. Archive resolved critique findings from today's session
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: There are 3 critique files in `.shoe-makers/findings/` (critique-2026-03-23-063 through 065), all marked resolved. Archiving them to `.shoe-makers/findings/archive/` would reduce noise for future explore cycles that scan findings. This is routine housekeeping the previous elves have done regularly.
