---
title: Bootstrapping
category: overview
tags: [bootstrapping, self-hosting, scheduled-tasks, chicken-and-egg]
summary: How shoe-makers bootstraps itself — using the dumb version to build the smart version, then the system takes over.
last-modified-by: user
---

## The Chicken and Egg

The shoe-makers system is described in this wiki. But the system doesn't exist yet. We want agents to build it, but the agents need the system to coordinate them.

Solution: **use the dumb version to build the smart version**.

## Phase 0: Scaffolding (manual)

Done by hand in the initial session:

- Init git repo
- Write the wiki pages (the spec)
- Scaffold the Bun/TypeScript project
- Build the behaviour tree evaluator and tests
- Write a CLAUDE.md that serves as the bootstrap protocol
- Push to GitHub

## Phase 1: Poor-Man's Shoe-Makers

Set up a [[scheduled-tasks|Claude Code scheduled task]] with a prompt that **acts like** the [[behaviour-tree]]:

1. Read the wiki in `wiki/pages/` — this is the spec
2. Read the source code in `src/` — this is what's built so far
3. Compare: what's specified but not implemented?
4. Pick the most foundational unimplemented thing
5. Build it on a `shoemakers/YYYY-MM-DD` branch
6. Run tests, verify, commit

This is a single scheduled task with a smart prompt. It doesn't have the behaviour tree evaluator, the invariants pipeline, or the skill registry — it just reads the wiki and does its best. But it's enough to start closing the gap between spec and implementation.

The CLAUDE.md in the repo guides this — it tells the agent what the project is, where the spec lives, and how to work.

## Phase 2: Self-Hosting

Once the core components are built (behaviour tree evaluator, world state reader, skill invocation), the system switches from the manual prompt to running itself:

- The scheduled task invokes shoe-makers' own `src/index.ts`
- The behaviour tree evaluates against the real world state
- Skills are invoked as [[pure-function-agents]]
- The wiki spec drives what gets built next

At this point, shoe-makers is maintaining and improving itself using its own [[behaviour-tree]].

## Phase 3: Generalisation

Once self-hosting works, the system can be installed in other repos:

```bash
shoemakers init   # scaffolds .shoe-makers/, imports existing docs
shoemakers scan   # runs invariants pipeline, shows gaps
```

Then set up a scheduled task and the elves go to work.

## What Gets Built First

The [[behaviour-tree]] evaluator is the foundation — everything else plugs into it. Build order:

1. **Tree evaluator** (done — `src/tree/evaluate.ts`)
2. **World state reader** — gather branch status, test results, invariant counts
3. **Scheduler/tick loop** — the entry point that runs the tree each tick
4. **Skill invocation** — run a pure-function agent based on tree output
5. **Invariants integration** — connect to octowiki's pipeline
6. **Verification gate** — test + review before committing

See also: [[architecture]], [[behaviour-tree]], [[wiki-as-spec]], [[scheduled-tasks]]
