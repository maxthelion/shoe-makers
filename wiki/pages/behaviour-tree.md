---
title: Behaviour Tree
category: architecture
tags: [behaviour-tree, core, npc, game-ai, scheduler]
summary: The core behaviour tree — evaluated every tick like an NPC in a game, routing to pure-function agents based on world state.
last-modified-by: user
---

## The NPC Model

The shoe-makers system works like NPCs in games. Every tick (5 minutes), a behaviour tree is evaluated against the current world state. The path through the tree determines which agent to invoke. No central diagnoser or prioritiser is needed — the tree structure itself encodes priority.

This is fundamentally different from Octopoid's approach of tracking task state through a flow/state machine. A behaviour tree re-evaluates from scratch every tick, so it **cannot get stuck**. If an agent crashes or produces garbage, the next tick just sees the same world state and tries again.

## The Tree

The tree routes between [[tick-types]] — not every tick produces code. Some ticks assess, some prioritise, some work, some verify.

```
Root (selector — pick first applicable)
├── Is assessment stale (>30 min)? → AssessAgent
├── Is assessment newer than priorities? → PrioritiseAgent
├── Is there unverified work on branch? → VerifyAgent
├── Is there a top priority to work on? → WorkAgent
├── Sleep
```

The ASSESS and PRIORITISE ticks are **thinking ticks** that produce files on the [[tick-types#the-blackboard|blackboard]] (`.shoe-makers/state/`). The WORK tick reads the prioritised list and invokes the appropriate [[skills|skill]]. The VERIFY tick checks the work and commits or reverts.

The system naturally cycles: assess → prioritise → work → verify → assess again. Staleness checks drive the pacing — no fixed schedule.

### Prioritisation

Prioritisation is the one place where an LLM call IS justified in the routing layer. The PrioritiseAgent reads the assessment and weighs candidates by impact, confidence, risk, balance, and dependencies. It produces a ranked list that subsequent WORK ticks consume deterministically.

This solves the static-priority problem: a critical doc inconsistency can outrank a trivial feature gap because the prioritiser uses judgement, not a fixed ordering.

## The Tick

Every 5 minutes:

1. Read world state (branch status, test results, code health, git log)
2. Walk the behaviour tree
3. First matching condition → invoke the corresponding [[pure-function-agents|pure-function agent]]
4. Agent writes files to the shoemakers branch
5. Agent exits
6. Scheduler handles side effects (commit, push, etc.)
7. Wait for next tick

## Why No Diagnoser?

A central LLM-based diagnoser would be more flexible but adds:
- Cost (LLM call every tick just to decide what to do)
- Unpredictability (might make different decisions with same inputs)
- A failure point (if the diagnoser breaks, nothing works)

The tree is deterministic, cheap, and debuggable. The LLM only fires when an agent actually does work — which is where you want the intelligence.

If the tree turns out to be too rigid, an LLM assessment node can be added later. But start without one.

## Branch as State

The shoemakers branch IS the task state. No database, no task tracker, no D1.

- Unfinished work = uncommitted or partial changes on the branch
- Completed work = clean commits ready for review/merge
- Failed work = revert and the branch returns to its previous state

This eliminates the entire class of bugs that killed [[existing-projects#octopoid|Octopoid]] — tasks stuck between states, locks held by dead agents, inconsistent state between server and agents.

## Comparison to Octopoid

| Octopoid | Shoe-makers |
|----------|------------|
| State machine (fragile) | Behaviour tree (re-evaluates each tick) |
| Task state tracked in D1 | Branch IS the state |
| Semi-deterministic routing | Fully deterministic routing |
| Autonomous execution | Autonomous execution (same) |
| Pipeline gets stuck | Can't get stuck — re-evaluates from scratch |
| Tasks stuck between states | No states to get stuck between |
