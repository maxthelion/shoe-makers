---
title: Behaviour Tree
category: architecture
tags: [behaviour-tree, core, npc, game-ai, scheduler]
summary: The core behaviour tree — evaluated every tick like an NPC in a game, reacting to world state and working until conditions are resolved.
last-modified-by: user
---

## The NPC Model

The shoe-makers system works like NPCs in games. Every tick, a behaviour tree is evaluated against the current world state. The first matching condition determines what the agent does. The agent works on that action until the condition is resolved — then the tree falls through to the next applicable action.

This is reactive, not planned. The agent doesn't decide a sequence of tasks. It looks at the world, does the most important thing, and when that's done, looks again.

## How Game Behaviour Trees Work

In games, an NPC's tree is evaluated every frame:

```
Selector (try each child, first match wins)
├── [enemy nearby?] → fight
├── [low health?] → find health pack
├── [loot nearby?] → collect loot
├── patrol
```

- Actions return three states: **SUCCESS** (done), **FAILURE** (can't), **RUNNING** (still working)
- RUNNING means "keep doing this" — the NPC continues fighting until the enemy is dead
- When the condition resolves (enemy dies), the tree falls through to the next match
- Priority is the tree order — fighting always beats looting because it's higher
- The NPC never plans — it reacts to what's in front of it

## The Shoe-Makers Tree

```
Selector
├── [tests failing?] → Fix them (test fixer role — scoped to failing files)
├── [unresolved critiques?] → Fix the flagged issues (fixer role — scoped to flagged files)
├── [unreviewed commits?] → Review adversarially (reviewer role — can only write findings)
├── [inbox messages?] → Read and act on them
├── [open plans?] → Write tests first, then implement (implementer role)
├── [specified-only invariants?] → Write tests first, then implement (implementer role)
├── [untested code?] → Write tests only (test writer role — tests only)
├── [undocumented code?] → Update the wiki (doc writer role — wiki only)
├── [code health below threshold?] → Refactor (refactorer role — scoped files)
├── [nothing?] → Explore deeper (assessor role — state and findings only)
```

Each condition has a **role** that determines what files the elf can write. See [[verification]] for the full permissions model. The reviewer checks that the previous elf stayed within its role's boundaries.

Each condition reads a cached assessment of the world. The agent works on the first match. Once the condition is resolved (tests pass, plan is implemented, invariant is satisfied), the tree naturally falls through to the next thing.

The **explore** action at the bottom prevents sleeping. When nothing obvious needs doing, the agent does a deeper assessment — reads the wiki more carefully, runs invariant checks, analyses code health. This surfaces work for the conditions above.

## How the Tick Works

1. Code evaluates the tree against cached world state — cheap, deterministic
2. Tree produces an **action + context** — a focused prompt like "fix these failing tests" or "review this diff adversarially"
3. The elf performs the action — this is where intelligence lives
4. The elf commits the result
5. Code re-evaluates the tree — the condition may no longer match
6. Tree falls through to the next applicable action
7. Repeat until time runs out or nothing matches

The elf gets a **narrow, scoped prompt** for each action. A verify action gives the elf reviewer instructions. A work action gives implementation instructions with the relevant [[skills|skill]]. The elf doesn't need to understand the whole system — just read the prompt and do the work.

## Priority

Priority is encoded in two places:

**Tree order** (macro): fixing tests is always more important than adding features, which is always more important than improving health. This is deterministic and built into the tree structure.

**Agent judgement** (micro): within a condition like "specified-only invariants?", the agent uses its intelligence to pick which invariant to tackle — the most impactful, the most foundational, the one that unblocks other work. This is where the LLM thinks.

A separate prioritisation phase is not needed. The tree handles macro priority. The agent handles micro priority within each action.

## Assessment and Exploration

In games, checking "enemy nearby?" is cheap. In shoe-makers, checking "specified-only invariants?" requires comparing wiki against code. This is expensive.

The solution: **cached assessment**. The conditions read a cached snapshot of the world. The snapshot is refreshed by the "explore" action at the bottom of the tree — or when the cache is stale.

```
.shoe-makers/state/assessment.json
```

This is the only blackboard file needed. It's written by the explore/assess action and read by all the tree conditions. When it's stale and nothing else matches, the explore action refreshes it.

## Branch as State

The branch is the state — no database, no task tracker. The assessment cache is an ephemeral file on the branch, not a separate system. Delete the branch and you start clean.

This eliminates the entire class of bugs that killed [[existing-projects#octopoid|Octopoid]] — tasks stuck between states, locks held by dead agents, inconsistent state between server and agents.

## Comparison to Octopoid

| Octopoid | Shoe-makers |
|----------|------------|
| State machine (fragile) | Behaviour tree (re-evaluates each tick) |
| Task state tracked in D1 | Branch + cached assessment |
| Complex flow transitions | Reactive: fix condition, fall through |
| Pipeline gets stuck | Can't get stuck — re-evaluates from scratch |
| Tasks stuck between states | No states to get stuck between |

See also: [[pure-function-agents]], [[invariants]], [[verification]], [[skills]]
