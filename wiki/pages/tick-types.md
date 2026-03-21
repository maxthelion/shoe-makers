---
title: Tick Types
category: architecture
tags: [tick, map-reduce, assessment, prioritisation, blackboard, statefulness]
summary: Not every tick produces code. Some ticks assess, some prioritise, some work, some verify. Files on the branch are the shared state between ticks.
last-modified-by: user
---

## The Problem with Static Priority

A flat priority list (features > tests > docs > health) is too rigid:

- A critical doc inconsistency that causes agents to build the wrong thing should outrank a trivial feature gap
- There's no sense of magnitude — a huge spec gap and a tiny one look the same
- No way to balance different types of work over time (e.g. "we've been doing features for 3 nights, consolidate tests")

## Map-Reduce Across Ticks

Not every tick produces code. Some ticks are **thinking ticks** that produce inputs for future ticks. This is a map-reduce pattern spread across time:

### ASSESS (map)

Gather raw data about the state of things:
- Run [[invariants]] pipeline (or read cached results)
- Run octoclean scan
- Check git log for recent activity
- Read open [[plans-vs-spec|plans]]
- Check test results

Produces: `.shoe-makers/state/assessment.json`

### PRIORITISE (reduce)

Read the assessment, weigh candidates, produce a ranked list. This is where an LLM call **is** justified — it needs judgement to weigh "critical doc inconsistency" against "minor feature gap". But it only runs when the assessment changes, not every tick.

The prioritiser considers:
- **Impact**: how much does this matter to the project?
- **Confidence**: how likely is an agent to get this right?
- **Risk**: what breaks if the agent gets it wrong?
- **Balance**: have we been doing too much of one type of work?
- **Dependencies**: does this unblock other work?

Produces: `.shoe-makers/state/priorities.json`

### WORK

Read the priority list, pick the top item, do the work. This is the [[pure-function-agents|pure-function agent]] invocation. The agent writes code, tests, or docs to the branch.

Produces: file changes on the branch + `.shoe-makers/state/current-task.json`

### VERIFY

Check the work from the last WORK tick. Run tests, adversarial review, invariant re-check. Commit if it passes, revert if it doesn't.

Produces: `.shoe-makers/state/verification.json`, commit or revert

## The Blackboard

The `.shoe-makers/state/` directory on the branch is a **blackboard** — a concept from game AI where different systems read and write to shared memory. Each tick type reads what previous ticks wrote and produces new state for future ticks.

```
.shoe-makers/state/
  assessment.json      ← written by ASSESS, read by PRIORITISE
  priorities.json      ← written by PRIORITISE, read by WORK
  current-task.json    ← written by WORK, read by VERIFY
  verification.json    ← written by VERIFY, read by ASSESS (next cycle)
```

This makes the system **stateful across ticks without a database**. The branch IS the state. If the branch is deleted, the state resets cleanly.

## The Revised Tree

```
Root (selector)
├── Is assessment stale (>30 min)? → AssessAgent
├── Is assessment newer than priorities? → PrioritiseAgent
├── Is there unverified work on branch? → VerifyAgent
├── Is there a top priority to work on? → WorkAgent
├── Sleep
```

The system naturally cycles: assess → prioritise → work → verify → assess again. Each tick does one thing. The sequence across ticks produces the full loop.

## Staleness, Not Scheduling

Ticks don't follow a fixed schedule like "assess at 1am, work at 1:05am". Instead, each tick checks what's stale:

- Assessment is stale if it's older than 30 minutes (or if code has changed since last assessment)
- Priorities are stale if the assessment is newer than the priorities
- Work is stale if there's a priority item with no work started
- Verification is needed if there are uncommitted changes

This means the system self-balances. After a burst of work ticks, the assessment gets stale and triggers a re-assessment. After a re-assessment, priorities get recalculated. Natural pacing without explicit scheduling.

See also: [[behaviour-tree]], [[pure-function-agents]], [[invariants]], [[branching-strategy]]
