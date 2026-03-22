---
title: Behaviour Tree
category: architecture
tags: [behaviour-tree, core, npc, game-ai, scheduler]
summary: The behaviour tree — reactive conditions for urgent work, three-phase orchestration for proactive work.
last-modified-by: user
---

## The NPC Model

The shoe-makers system works like NPCs in games. Each invocation, the behaviour tree is evaluated against the world state. The first matching condition determines what the elf does. The elf does ONE thing and exits. The next invocation evaluates the tree again.

One invocation, one action, one exit. The scheduled task interval provides the loop.

## The Tree

The tree has two zones: **reactive** conditions at the top (urgent, handled directly) and a **three-phase orchestration** at the bottom (proactive work).

```
Selector
├── [tests failing?] → Fix tests (direct prompt)
├── [unresolved critiques?] → Fix critiques (direct prompt)
├── [unreviewed commits?] → Review adversarially (direct prompt)
├── [inbox messages?] → Handle inbox (direct prompt)
├── [work-item.md exists?] → Execute it
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [neither?] → Explore: write candidates.md
```

### Reactive zone (top)

These fire immediately with a direct prompt. No orchestration needed — the action is obvious.

- **Tests failing** — always highest priority. The elf gets the test output and fixes it.
- **Unresolved critiques** — blocking findings from a previous reviewer. Must fix before new work.
- **Unreviewed commits** — a previous elf's commits need adversarial review. The reviewer gets the diff and the rules the previous elf was given.
- **Inbox messages** — human instructions take priority over self-directed work.

### Three-phase orchestration (bottom)

Proactive work goes through three phases across three separate invocations:

**1. Explore** — broad context, produces a candidate list.
The elf reads everything: wiki, code, findings, invariants, health scores. It produces `.shoe-makers/state/candidates.md` — a ranked list of possible work items with reasoning about why each matters. This is where the elf discovers what needs doing.

**2. Prioritise** — medium context, produces one detailed work item.
The elf reads the candidate list, reads the relevant wiki pages and source files for the top candidates, and picks one. It writes `.shoe-makers/state/work-item.md` — a specific, detailed prompt with full context: the relevant wiki text, the relevant code, exactly what to build, which patterns to follow. This is the orchestrator that writes really good instructions.

**3. Execute** — narrow context, does the work.
The elf reads `work-item.md` and does exactly what it says. It commits and optionally writes a new `work-item.md` for the next elf (e.g. "review what I just built" or "write tests for this feature"). This creates a natural handoff chain.

### Why three phases?

Each phase narrows the context for the next:
- Explore reads everything → produces a list
- Prioritise reads the list + relevant code → produces one detailed instruction
- Execute reads one instruction → does one thing

This solves the problem of elves getting generic prompts. The prioritiser's entire job is to write a specific, detailed prompt — it reads the wiki, looks at the code, and tells the executor exactly what to build and how. The executor doesn't need to figure out what to work on.

### State files

```
.shoe-makers/state/
  assessment.json   ← cached world state, read by tree conditions
  candidates.md     ← written by explore, read by prioritise
  work-item.md      ← written by prioritise (or by executor as handoff), read by executor
  last-action.md    ← copy of previous action, read by reviewer
```

After execution, `work-item.md` is consumed (deleted or replaced with a follow-up). After prioritisation, `candidates.md` is consumed. This ensures the cycle advances: explore → prioritise → execute → (explore again when no items remain).

## Priority

**Reactive conditions** have fixed priority encoded in tree order. Tests always beat critiques, critiques always beat reviews, reviews always beat inbox.

**Proactive work** is prioritised by the prioritise elf using LLM judgement. Health issues, spec gaps, untested code, stale docs, open plans — all appear as candidates. The prioritiser weighs impact, confidence, risk, and balance. A critical doc inconsistency can outrank a trivial feature gap.

No hardcoded priority between health/features/tests/docs. The prioritiser decides each cycle.

## Review as Handoff

After executing work, the elf can write a new `work-item.md` that says "review my last commit." The next invocation sees `work-item.md exists` and the elf gets a review prompt. This is how adversarial review happens for proactive work — not as a tree condition, but as a handoff from the executor.

For reactive work (fixing tests, handling inbox), the unreviewed-commits condition catches it on the next cycle.

## Branch as State

The branch is the state — no database, no task tracker. State files are ephemeral on the branch. Delete the branch and start clean.

See also: [[pure-function-agents]], [[invariants]], [[verification]], [[skills]]
