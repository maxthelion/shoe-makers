# README: document partial work and continue-work

skill-type: doc-sync

## What to change

Add a brief paragraph to README.md explaining the partial work mechanism. The tree diagram already shows `[partial work?] → Continue partial work` but there's no explanation.

## Where to add it

In README.md, after the three-phase orchestration paragraph (after "Each phase narrows the context for the next. The prioritiser's job is to write a really good prompt for the executor."), add a paragraph about partial work:

```markdown
**Partial work** handles the case where an agent runs out of time mid-task. The agent writes a handoff file (`.shoe-makers/state/partial-work.md`) describing what's done and what remains. The next tick detects this and routes to a continue-work agent that picks up where the previous elf left off — no work is lost to timeouts.
```

## What NOT to change

- Do NOT modify any source code files
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages
- Do NOT change the tree diagram or other existing README content

## Decision Rationale

Picked over health score improvement (#2) and architecture wiki update (#3) because it addresses a user-facing documentation gap for a significant feature.
