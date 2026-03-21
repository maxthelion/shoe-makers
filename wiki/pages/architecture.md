---
title: Architecture
category: architecture
tags: [architecture, core, behaviour-tree, scheduled-tasks]
summary: The core architecture — a reactive behaviour tree that evaluates conditions and takes action until they're resolved.
last-modified-by: user
---

## Core Insight

The system works like NPCs in games. A [[behaviour-tree]] is evaluated every tick against cached world state. The first matching condition determines what the agent does. The agent works on that action until the condition is resolved, then the tree falls through to the next thing.

This is reactive, not planned. No central scheduler, no task queue, no state machine. Just: look at the world, do the most important thing, repeat.

## The Tick Loop

1. Code evaluates the [[behaviour-tree]] against cached world state — cheap, deterministic
2. First matching condition → produce a **focused prompt** for the agent (e.g. "fix these failing tests", "review this diff")
3. The elf performs the action — this is where intelligence lives
4. The elf commits the result
5. Code re-evaluates the tree — the condition may no longer match
6. Falls through to the next applicable action
7. Repeat until time runs out or nothing matches

### The Tree

```
Selector
├── [tests failing?] → Fix them
├── [unverified work on branch?] → Review adversarially
├── [inbox messages?] → Read and act on them
├── [open plans?] → Implement the most important one
├── [specified-only invariants?] → Implement the most impactful one
├── [untested code?] → Write tests
├── [undocumented code?] → Update the wiki
├── [code health below threshold?] → Fix the worst file
├── [nothing?] → Explore deeper to surface new work
```

Conditions read a cached assessment (`.shoe-makers/state/assessment.json`). The "explore" action at the bottom refreshes the cache when it's stale — this prevents sleeping by surfacing work for conditions above.

### Pure Function Agents

Agents are [[pure-function-agents|pure functions]] (the best idea from Octopoid):
- Receive: a focused prompt scoped to one action + relevant context
- Produce: file changes on the shoemakers branch
- Side effects: **none** — the tick loop handles commits

The elf gets a narrow prompt for each action. A verify action gives reviewer instructions. A work action gives implementation instructions with the relevant [[skills|skill]]. The elf doesn't need to understand the whole system.

### Priority

- **Tree order** (macro): tests > verification > inbox > plans > features > tests > docs > health. Deterministic.
- **Agent judgement** (micro): within each action, the elf chooses WHICH invariant, WHICH plan, WHICH file. This is where the LLM thinks.

No separate prioritisation phase needed.

### The Branch

The branch IS the state. No database, no task tracker.
- Cached assessment is an ephemeral file, not a database
- Delete the branch and start clean
- The system can be interrupted at any point and resume correctly

### What Lives in the Repo

```
.shoe-makers/
  protocol.md         # instructions for the elf
  config.yaml         # overridable settings
  invariants.md       # hierarchical spec claims
  skills/             # markdown skill prompts
  state/              # cached assessment (ephemeral)
  log/                # shift logs (per day)
  findings/           # persistent observations
  inbox/              # messages from humans
```

See also: [[behaviour-tree]], [[pure-function-agents]], [[skills]], [[verification]], [[invariants]]
