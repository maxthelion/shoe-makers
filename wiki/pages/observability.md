---
title: Observability
category: architecture
tags: [observability, logging, findings, journal, continuity]
summary: How agents leave a trail for future elves and the morning human review — the shift log, findings, and suggestions.
last-modified-by: user
---

## The Problem

Each agent invocation starts cold. Without observability:
- The next agent doesn't know what the last one tried, learned, or got stuck on
- The human reviewing the branch in the morning sees commits but not reasoning
- Patterns (what keeps failing, what's blocked, what's working) are invisible
- The PRIORITISE tick has no memory of previous cycles

## Three Types of Output

### 1. The Shift Log

**What happened.** A chronological record of each tick's actions during a night shift. Append-only markdown file per shift.

```
.shoe-makers/log/2026-03-21.md
```

Each entry records:
- Timestamp
- Which tick type ran (assess / prioritise / work / verify)
- What was attempted
- What the outcome was (committed, reverted, deferred)
- How long it took

This is factual and terse. It's for the human reviewing the branch in the morning and for debugging when something goes wrong.

### 2. Findings

**What the agent learned.** Observations that persist until they're resolved. These are the most valuable output an agent can leave — they're context that would otherwise be lost between sessions.

```
.shoe-makers/findings/
  wiki-verification-vague.md
  types-need-refactoring.md
  scheduler-blocked-by-blackboard.md
```

Each finding is a short markdown file with:
- What was observed
- Why it matters
- Whether it's a blocker, a question, or just a note

Findings are read by future agents during the ASSESS tick. They're part of the world state. A finding can be resolved (deleted or archived) when the issue is addressed.

Examples of good findings:
- "The wiki says X but the code does Y — unclear which is correct"
- "Implementing the scheduler requires the blackboard reader to exist first"
- "Test coverage is good for the tree evaluator but missing everywhere else"
- "The invariants integration depends on octowiki being available — how should this work in CI?"

### 3. Suggestions

**What the agent recommends.** Direct input to the PRIORITISE tick. These are opinions about what should be worked on next and why.

Suggestions live in the shift log or as findings tagged with a recommendation. The PRIORITISE tick reads them alongside the assessment data.

## How Agents Write These

Every agent invocation — regardless of tick type — should:

1. **Append to the shift log** before exiting: what it did, what happened
2. **Create a finding** if it encountered something surprising, blocking, or important for future agents
3. **Note suggestions** in the shift log if it has opinions about priority

This is part of the agent protocol, not optional. An agent that does good work but leaves no trail is less valuable than one that does modest work but documents what it found.

## How Agents Read These

During the ASSESS tick:
- Read all findings — they're part of the world state
- Read the most recent shift log entries — recent context matters

During the PRIORITISE tick:
- Factor findings and suggestions into ranking
- A finding that says "X is blocked by Y" should boost Y's priority

During the WORK tick:
- Read findings related to the current task — previous agents may have tried this before

## The Morning Review

When the human reviews the shoemakers branch, they should be able to:

1. Read the shift log to understand the narrative of the night's work
2. Scan findings for anything that needs human decision
3. Review commits with full context for why they were made

The shift log is the primary interface between the elves and the human.

## Relationship to Other State

| Type | Purpose | Lifetime | Reader |
|------|---------|----------|--------|
| [[tick-types#the-blackboard\|Blackboard]] | Machine-readable tick state | Reset each cycle | Tree evaluator |
| [[wiki-as-spec\|Wiki]] | The specification | Permanent | Everyone |
| Shift log | What happened tonight | Per branch/shift | Human + agents |
| Findings | Persistent observations | Until resolved | Agents + human |

See also: [[tick-types]], [[behaviour-tree]], [[branching-strategy]]
