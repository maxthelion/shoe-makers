# Finding: Session 2026-03-22 — Skill prompt integration and test coverage

## What happened

This session implemented the "work actions include relevant skill prompts" feature and improved test coverage.

## Features implemented

1. **Skill prompt integration** (`src/prompts.ts`) — `generatePrompt()` now accepts an optional skills map and includes the matching skill's body content for work actions (implement-spec, implement-plan, fix-tests, write-tests, improve-health, document). The skill section is clearly marked with `## Skill: <name>`. Backward compatible — works without skills parameter.

2. **Setup wires skill loading** (`src/setup.ts`) — Setup now loads skills from `.shoe-makers/skills/` and passes them to `generatePrompt()`, so the next-action.md includes skill-specific instructions.

3. **Missing runSkill cases** (`src/scheduler/run-skill.ts`) — Added `fix-critique` and `critique` action handlers that were falling through to "Unknown action".

## Bug found and fixed

The initial implementation had incorrect `ACTION_TO_SKILL_TYPE` mappings:
- `fix-tests` mapped to `"fix-tests"` but skill file uses `maps-to: fix`
- `write-tests` mapped to `"test-coverage"` but skill file uses `maps-to: test`
- `document` was unmapped (should map to `doc-sync`)

This was caught by adversarial review (critique-2026-03-22-001). An integration test was added to prevent recurrence — it loads real skill files from disk and validates mappings match.

## Additional fixes

4. **Missing SKILL_TO_ACTION mappings in tick.ts** — `fix-critique` and `critique` were in the tree but not in tick's skill-to-action mapping, causing `tick()` to return `action: null`.

5. **Tick entry point skill loading** (`src/index.ts`) — `bun run tick` now loads skills from disk before generating prompts, matching the setup behavior.

6. **Shift test type completeness** — Fixed incomplete `WorldState` objects in shift tests (missing `hasUnreviewedCommits` and `unresolvedCritiqueCount` fields).

## Tests added

- 10 new prompt tests (skill content inclusion, backward compat, non-work action exclusion)
- 2 integration tests (skill-to-action mapping validation against real files)
- 6 blackboard tests (writePriorities, writeVerification, clearCurrentTask, clearPriorities, safe-when-missing)
- 2 runSkill tests (fix-critique, critique)
- 4 tick tests (fix-critique, critique, priority ordering)
- 2 shift tests (fix-critique action, critique action)

Total tests: 220 → 246 (+26)

## Status

Complete.
