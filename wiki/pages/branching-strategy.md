---
title: Branching Strategy
category: architecture
tags: [git, branches, workflow, night-shift]
summary: How the shoemakers branch works — one branch per night shift, auto-merge within it, human merges to main.
last-modified-by: user
---

## One Branch Per Night Shift

Each night, the scheduler creates a fresh branch:

```
shoemakers/2026-03-21
```

All agent work during that night is committed to this branch. Agents auto-merge freely — no approval needed within the shoemakers branch.

In the morning, the human reviews the branch and merges to main (or doesn't).

## Why This Works

- **Agents have freedom**: they can commit, revert, retry without bothering anyone
- **Humans have control**: nothing reaches main without review
- **Clean history**: each night's work is a single branch, easy to review as a whole
- **Easy rollback**: if a night's work is bad, just don't merge it
- **No conflicts**: only one branch is active at a time, and the human merges before the next night

## The Branch Lifecycle

```
6pm: Human finishes work, pushes to main
1am: Scheduler creates shoemakers/2026-03-21 from main
1am-6am: Behaviour tree ticks every 5 minutes
  → agents commit to the branch
  → tests run against the branch
  → verification gates reject bad commits (revert)
8am: Human reviews the branch
  → merge to main, or
  → cherry-pick specific commits, or
  → discard
```

## Branch as State

The branch doubles as the task state for the [[behaviour-tree]]:

- **Clean branch, no changes** → tree evaluates what new work to start
- **Partial changes, tests passing** → tree may continue or start new work
- **Partial changes, tests failing** → tree routes to FixAgent
- **Clean commits, all green** → tree looks for next thing to do

See also: [[behaviour-tree]], [[pure-function-agents]], [[verification]]
