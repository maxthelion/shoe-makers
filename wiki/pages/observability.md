---
title: Observability
category: architecture
tags: [observability, logging, findings, journal, continuity]
summary: How agents leave a trail for future elves and the morning human review — the shift log, findings, and suggestions.
last-modified-by: elf
---

## The Problem

Each agent invocation starts cold. Without observability:
- The next agent doesn't know what the last one tried, learned, or got stuck on
- The human reviewing the branch in the morning sees commits but not reasoning
- Patterns (what keeps failing, what's blocked, what's working) are invisible
- The prioritise action has no memory of previous cycles

## Three Types of Output

### 1. The Shift Log

**What happened.** A chronological record of each tick's actions during a night shift. Append-only markdown file per shift.

```
.shoe-makers/log/2026-03-21.md
```

Each entry records:
- Timestamp (HH:MM UTC)
- Which action the tree selected (e.g. fix-tests, explore, critique, execute-work-item)
- The behaviour tree evaluation trace (which conditions were checked and whether they passed)
- The result of running the action (if any)
- Errors (if any)

The shift log is automated by `appendToShiftLog()` in `src/log/shift-log.ts` and the setup script. Entries are appended as markdown sections. The shift runner (`src/scheduler/shift.ts`) also produces a `ShiftSummary` that categorises actions into improvement types (fix, feature, test, docs, health, review) and tracks whether improvements are balanced.

The `ShiftSummary` also includes a `TraceAnalysis` that classifies each tick by tree depth: **reactive** (depth 1-2, e.g. tests failing), **routine** (depth 3-4, e.g. critiques or work items), or **explore** (depth 5+, nothing urgent to do). This gives humans visibility into whether the system is operating healthily — a shift that's mostly reactive means things keep breaking, while a shift that's mostly explore means the codebase is stable. The dashboard line looks like: `Tree: 2 reactive, 6 routine, 2 explore | avg depth 4.2`.

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

**What the agent recommends.** Direct input to the prioritise action. These are opinions about what should be worked on next and why.

Suggestions live in the shift log or as findings tagged with a recommendation. The PRIORITISE tick reads them alongside the assessment data.

## How Agents Write These

Every agent invocation — regardless of tick type — should:

1. **Append to the shift log** before exiting: what it did, what happened
2. **Create a finding** if it encountered something surprising, blocking, or important for future agents
3. **Note suggestions** in the shift log if it has opinions about priority

This is part of the agent protocol, not optional. An agent that does good work but leaves no trail is less valuable than one that does modest work but documents what it found.

## How Agents Read These

During the **explore** action:
- Read all findings — they're part of the assessment (world state)
- Read the most recent shift log entries — recent context matters

During **execution** actions (execute-work-item):
- Read findings related to the current task — previous agents may have tried this before
- Factor suggestions into selecting which item to work on

## The Morning Review

When the human reviews the shoemakers branch, they should be able to:

1. Read the shift log to understand the narrative of the night's work
2. Check the tree trace analysis in the dashboard to understand whether the shift was reactive (fixing problems) or proactive (exploring and improving)
3. Scan findings for anything that needs human decision
4. Review commits with full context for why they were made

The shift log is the primary interface between the elves and the human.

## Relationship to Other State

| Type | Purpose | Lifetime | Reader |
|------|---------|----------|--------|
| Blackboard (`.shoe-makers/state/`) | Machine-readable cached state (assessment, task) | Persists until refreshed by explore | Tree evaluator |
| [[wiki-as-spec\|Wiki]] | The specification | Permanent | Everyone |
| Shift log | What happened tonight | Per branch/shift | Human + agents |
| Findings | Persistent observations | Until resolved | Agents + human |

See also: [[tick-types]], [[behaviour-tree]], [[branching-strategy]]
