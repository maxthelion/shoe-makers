# Archive done plan: delete agent-work-execution.md

skill-type: doc-sync

## Context

`wiki/pages/agent-work-execution.md` is a plan page (`category: plan`) with `status: done`. All 6 success criteria are checked off. Per `wiki/pages/plans-vs-spec.md:47-48`:

> - `status: done` — plan is complete. Should be archived to spec or deleted. Excluded from open plans.

The plan's content (task lifecycle, three-phase execution, the elf IS the LLM) is already documented in:
- `wiki/pages/tick-types.md` — three-phase orchestration, "The Elf IS the LLM"
- `wiki/pages/scheduled-tasks.md` — setup script, task lifecycle
- `wiki/pages/behaviour-tree.md` — tree routing and phase model
- `wiki/pages/pure-function-agents.md` — agent model and partial work

## What to change

Delete `wiki/pages/agent-work-execution.md`. The plan is done and its content is captured in spec pages.

## Files to modify

- `wiki/pages/agent-work-execution.md` — delete this file

## What NOT to change

- Do NOT modify any source files
- Do NOT modify other wiki pages
- Do NOT modify invariants
- Do NOT create new files

## Tests

Run `bun test` to confirm nothing references this wiki page in tests.

## Decision Rationale

Candidate #1 was chosen because it directly addresses wiki hygiene specified by the plans-vs-spec page. Done plans should not linger — they clutter the wiki and could confuse future explore cycles. Candidate #2 needs verification first. Candidate #3 is low impact.
