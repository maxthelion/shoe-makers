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

```
Root (selector — pick first applicable)
├── Is there a failing test on the shoemakers branch? → FixAgent
├── Is there unfinished work on the branch? → ContinueAgent
├── Any specified-only invariants? → ImplementAgent
├── Any implemented-untested invariants? → TestAgent
├── Any unspecified invariants? → DocSyncAgent
├── Is there a code health score below threshold? → CleanAgent
├── Nothing to do → Sleep
```

Nodes higher in the tree have higher priority. The tree is evaluated top-down — first matching node wins. No LLM call needed for routing, just condition checks against world state.

The [[invariants]] report is the primary world state the tree reads. The first two nodes handle immediate branch health; the next three are driven by the gap between [[wiki-as-spec|wiki spec]] and code.

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
