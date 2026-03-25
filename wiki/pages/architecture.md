---
title: Architecture
category: architecture
tags: [architecture, core, behaviour-tree, scheduled-tasks]
summary: The core architecture — one invocation, one action, one exit. Reactive conditions plus three-phase orchestration.
last-modified-by: elf
---

## Core Insight

Each scheduled invocation does ONE thing and exits. The behaviour tree evaluates, picks an action, the elf does it, exits. The next invocation evaluates again. The schedule provides the loop — the elf never loops internally.

## The Invocation

1. Setup script evaluates the [[behaviour-tree]] against cached world state
2. Tree picks the first matching condition
3. The elf gets a **focused prompt** for that one action
4. The elf does the work, commits, exits
5. Next invocation: tree evaluates again from scratch

## The Tree

Two zones: reactive (urgent, direct prompt) and orchestrated (proactive, three-phase).

```
Selector
├── [tests failing?]         → Fix tests (direct)
├── [review-loop ≥3?]        → Break out to explore (circuit breaker)
├── [unresolved critiques?]  → Fix critiques (direct)
├── [unreviewed commits?]    → Review adversarially (direct)
├── [uncommitted changes?]   → Review uncommitted work (direct)
├── [inbox messages?]        → Handle inbox (direct)
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [insights exist?]        → Evaluate insight (generous disposition)
├── [innovation tier?]       → Innovate: write insight from creative brief
└── [always]                 → Explore: write candidates.md
```

### Reactive zone

Tests, critiques, reviews, and inbox messages fire immediately. The prompt is generated directly — no orchestration needed.

### Three-phase orchestration

Proactive work goes through explore → prioritise → execute across three separate invocations:

1. **Explore**: read everything (wiki, code, invariants, health, findings), write `candidates.md`
2. **Prioritise**: read candidates + relevant code/wiki, pick one, write a detailed `work-item.md`
3. **Execute**: read `work-item.md`, do the work, optionally write a follow-up work-item for the next elf

The prioritise step IS the orchestrator — its job is to write a really good, specific prompt for the executor. Not "implement something from the wiki" but "the wiki says X, the code has Y, build Z in this file following this pattern."

### Pure Function Agents

Agents are [[pure-function-agents|pure functions]]:
- Receive: a focused prompt scoped to one action
- Produce: file changes on the shoemakers branch
- Side effects: **none** — the setup script handles commits

### Priority

- **Reactive conditions** have fixed priority in tree order (tests > critiques > reviews > inbox)
- **Proactive work** is prioritised by the prioritise elf using LLM judgement — no hardcoded ordering between features/tests/docs/health

### State Files

```
.shoe-makers/state/
  assessment.json   ← cached world state
  candidates.md     ← written by explore, consumed by prioritise
  work-item.md      ← written by prioritise/executor, consumed by executor
  last-action.md    ← previous action's prompt, read by reviewer
```

### The Branch

The branch IS the state. Delete it and start clean. No database, no server, no persistent process.

### What Lives in the Repo

```
.shoe-makers/
  protocol.md         # instructions for the elf
  config.yaml         # overridable settings
  invariants.md       # hierarchical spec claims (human-maintained)
  schedule.md         # working hours
  skills/             # markdown skill prompts
  state/              # ephemeral state files
  log/                # shift logs
  findings/           # persistent observations
  insights/           # creative proposals from analogical prompting
  inbox/              # messages from humans
  known-issues.md     # troubleshooting for elves
```

See also: [[behaviour-tree]], [[pure-function-agents]], [[skills]], [[verification]], [[invariants]]
