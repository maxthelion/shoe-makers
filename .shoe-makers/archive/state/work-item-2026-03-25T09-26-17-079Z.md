# Work Item: Sync CHANGELOG.md with recent additions and fixes

skill-type: doc-sync

## What to change

Update `CHANGELOG.md` to include user-facing changes from recent sessions that aren't yet documented.

## Changes to add under `## [Unreleased]`

### Under `### Added`

Add these entries after the existing "Added" items:

- `continue-work` action — detects and resumes partial work from previous elves via `.shoe-makers/state/partial-work.md`
- `innovate` action — creative exploration at innovation tier using random Wikipedia articles as conceptual lenses
- `evaluate-insight` action — generous evaluation of creative insights, separate from pragmatic prioritise
- `bun run setup` command — evaluates behaviour tree, writes focused prompt to `.shoe-makers/state/next-action.md`
- Review-loop breaker — tree breaks out of critique/fix-critique loops after 3 consecutive review actions
- Innovation cycle cap — `max-innovation-cycles` config limits creative cycles per shift (default: 3)
- `insight-frequency` config — controls probability of creative lens during explore (default: 0.3)
- Health regression detection — warns when octoclean health score drops between ticks
- State file archiving — consumed candidates and work items archived for traceability

### Under `### Fixed`

Add these entries after the existing "Fixed" items:

- Missing `continue-work` in `SKILL_TO_ACTION` map — `bun run tick`/`bun run shift` silently dropped partial work actions
- Missing `continue-work` in `runSkill` switch — shift runner returned "Unknown action" for continue-work
- Missing `continue-work` in shift-log-parser — process pattern counting missed continue-work actions

## File to modify

`CHANGELOG.md` — append new entries within the existing `## [Unreleased]` section.

## What NOT to change

- Do not change the format or existing entries
- Do not add entries that aren't user-facing (e.g., internal test improvements, drift-prevention tests)
- Do not modify any source code files

## Decision Rationale

CHANGELOG sync chosen over test-coverage candidates because invariant 3.5 explicitly requires the CHANGELOG to reflect current capabilities. The CHANGELOG is stale — it doesn't mention any of the creative exploration features, the setup-based workflow, or the continue-work fixes. This is a spec-code inconsistency that doc-sync should fix.
