---
title: Tick Types
category: architecture
tags: [tick, behaviour-tree, assessment, blackboard]
summary: Each tick evaluates the behaviour tree and produces a focused action prompt. The elf does that one thing, then the tree re-evaluates.
last-modified-by: elf
---

## The Game-Style Model

Each tick evaluates the [[behaviour-tree]] against cached world state. The first matching condition determines the action. The elf gets a focused prompt and does that one thing.

```
Selector
├── [tests failing?] → Fix them
├── [review-loop ≥3?] → Break out to explore (circuit breaker)
├── [unresolved critiques?] → Fix the flagged issues
├── [unreviewed commits?] → Review adversarially
├── [uncommitted changes?] → Review before committing
├── [inbox messages?] → Read and act
├── [dead-code work-item?] → Remove dead code
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight (generous disposition)
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

The tree has two zones: **reactive** conditions at the top (urgent, direct prompt) and **three-phase orchestration** at the bottom (proactive work).

## Three-Phase Orchestration

Proactive work goes through three phases across three separate invocations:

1. **Explore** — reads everything (wiki, code, invariants, health, findings), writes `candidates.md`
2. **Prioritise** — reads `candidates.md` + relevant code/wiki, picks one, writes `work-item.md`
3. **Execute** — reads `work-item.md`, does the work, deletes it

## State Files

```
.shoe-makers/state/
  assessment.json   ← cached world state, read by tree conditions
  candidates.md     ← written by explore, consumed by prioritise
  work-item.md      ← written by prioritise, consumed by executor
  last-action.md    ← previous action's prompt, read by reviewer
```

## How It Works

1. Code evaluates the tree — cheap, deterministic
2. Tree produces an **action + context** — a focused prompt
3. The elf performs the action — this is where intelligence lives
4. The elf commits the result
5. The tree re-evaluates — the condition may no longer match
6. Falls through to the next applicable action
7. Repeat until time runs out

## The Elf IS the LLM

The elf doesn't need to call an API — it IS the intelligence. LLM-based prioritisation happens when the elf picks which candidate to promote to a work item. Adversarial review happens when the elf reviews the diff. The tree provides structure; the elf provides judgement.

## Branch as State

The branch IS the state. State files are ephemeral on the branch. Delete the branch and start clean. No database, no task tracker.

See also: [[behaviour-tree]], [[pure-function-agents]], [[invariants]], [[branching-strategy]]
