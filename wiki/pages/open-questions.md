---
title: Open Questions
category: overview
tags: [questions, decisions, planning]
summary: Design questions — answered and remaining.
last-modified-by: user
---

## Answered

### Trust Level

Auto-merge into a dedicated branch per night shift (e.g. `shoemakers/2026-03-21`). The human reviews and merges into main in the morning. Agents commit freely to their branch, but a human gates the merge to main.

### Scope

One repo per installation. Each repo gets its own `.shoe-makers/` config, its own behaviour tree, its own shoemakers branch.

### Wiki Role

The wiki ([[existing-projects#octowiki|OctoWiki]]) is the **source of truth for what the application is intended to do**. Agents read it to understand project intent, priorities, and architectural constraints. This is how the elves know what to work on — not from a task list, but from understanding the project's purpose.

### What Killed Octopoid?

The pipeline kept breaking — tasks got stuck between states, didn't finish properly. The root cause was operating as a **semi-deterministic system**. The state machine was fragile; if anything went wrong mid-flow, recovery was hard. The [[behaviour-tree]] approach solves this by re-evaluating from scratch every tick — it can't get stuck.

What to keep: [[pure-function-agents]] (agents as pure functions with no side effects).

### Skill Discovery

The [[behaviour-tree]] structure encodes priority — nodes higher in the tree get evaluated first. No dynamic scoring or LLM-based diagnoser needed. The tree is deterministic, cheap, and debuggable. Humans can edit the tree to reorder priorities or disable branches.

### Setup / First Run

Install shoe-makers, run an init script (scaffolds `.shoe-makers/` in the repo), tweak the behaviour tree to your preferences, set it up as a [[scheduled-tasks|scheduled cloud job]].

### Multi-Round Gatekeeper (Answered)

Multi-round review **emerges from the tick loop**. If the VERIFY tick rejects work (reverts), the next cycle's ASSESS tick sees the gap is still there, PRIORITISE re-ranks it, and WORK tries again. No special multi-round mechanism needed — the natural cycle handles retries.

### MCP Integration

Octoclean and octowiki will probably be exposed as MCP servers — but this is an implementation detail.
