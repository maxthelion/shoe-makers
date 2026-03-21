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
├── [unverified work?] → Review adversarially
├── [inbox messages?] → Read and act
├── [open plans?] → Implement the most important one
├── [specified-only invariants?] → Implement the most impactful one
├── [untested code?] → Write tests
├── [undocumented code?] → Update the wiki
├── [health below threshold?] → Fix the worst file
├── [nothing?] → Explore deeper
```

Priority is encoded in the tree order (macro) and the elf's judgement within each action (micro). No separate prioritisation phase needed.

## The Assessment Cache

Conditions read a cached assessment:

```
.shoe-makers/state/assessment.json
```

This is the only blackboard file needed. It's written by the "explore" action and read by all tree conditions. When nothing else matches, the explore action refreshes the assessment to surface new work.

## How It Works

1. Code evaluates the tree — cheap, deterministic
2. Tree produces an **action + context** — a focused prompt
3. The elf performs the action — this is where intelligence lives
4. The elf commits the result
5. The tree re-evaluates — the condition may no longer match
6. Falls through to the next applicable action
7. Repeat until time runs out

## The Elf IS the LLM

The elf doesn't need to call an API — it IS the intelligence. LLM-based prioritisation happens when the elf picks which invariant to tackle. Adversarial review happens when the elf reviews the diff. The tree provides structure; the elf provides judgement.

## Branch as State

The branch IS the state. The assessment cache is an ephemeral file on the branch. Delete the branch and start clean. No database, no task tracker.

See also: [[behaviour-tree]], [[pure-function-agents]], [[invariants]], [[branching-strategy]]
