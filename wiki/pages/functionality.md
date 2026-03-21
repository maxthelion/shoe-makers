---
title: Functionality Overview
category: spec
tags: [functionality, overview, spec, user-facing]
summary: What shoe-makers does from a user's perspective — the complete feature set organised by concern.
last-modified-by: user
---

## What Shoe-Makers Is

Shoe-makers is a system that proactively improves a software project when run on a schedule. It uses a [[behaviour-tree]] to assess the project, prioritise work across different categories (features, tests, docs, health), and execute improvements via [[pure-function-agents]]. Work happens on a [[branching-strategy|nightly branch]] that a human reviews and merges in the morning.

The system maintains a [[wiki-as-spec|source of truth]] (wiki) about what the project is and should be, uses [[invariants]] to find gaps between spec and code, and keeps code health in check. Adversarial [[verification]] reviews agent work before it lands on the branch.

## Proactive Improvement

The core value proposition: you set it up, it works overnight, you wake up to improvements.

- Agents infer what should be built from the wiki spec — not from explicit task lists
- Agents discover improvements from code analysis: health scores, test gaps, dead code, stale docs
- Agents update the wiki as they build, keeping spec and code in sync
- The system should almost never sleep — if it's sleeping, the [[invariants|assessment is too shallow]]
- Improvement categories span: feature implementation, test coverage, documentation, code health, bug fixes

## Nightly Branch Workflow

All work is isolated and reviewable.

- Each shift creates a dedicated branch (e.g. `shoemakers/2026-03-21`)
- Agents commit freely to the branch — no approval needed within a shift
- Nothing reaches main without human approval — the human reviews in the morning
- The branch contains a [[observability|shift log]] explaining the narrative of the night's work
- Options in the morning: merge the whole branch, cherry-pick specific commits, or discard entirely
- If discarded, no state is lost — the system starts fresh next shift

## Human-Agent Communication

Humans steer, agents execute.

- **Inbox** (`.shoe-makers/inbox/`): drop a markdown file, the next elf reads it, acts on it with priority, deletes it, logs what it did
- **Shift logs** (`.shoe-makers/log/`): chronological record of each tick — what was attempted, what happened, what was committed. The primary interface for the morning review.
- **Findings** (`.shoe-makers/findings/`): persistent observations that survive across shifts until resolved. "The wiki says X but the code does Y." "Implementing Z is blocked by W."
- **Suggestions**: noted in the shift log, feed into the PRIORITISE tick. "The next elf should tackle the blackboard reader before the scheduler."

## Source of Truth

The wiki drives everything.

- The [[wiki-as-spec|wiki]] describes what the system is and does — this is the **spec**
- [[plans-vs-spec|Plans]] describe what the system should become — they are **deltas** from the current spec
- When a plan is implemented, the spec is updated and the plan is archived
- [[invariants]] compare the spec against the code and surface gaps as work candidates
- Agents create new spec pages when they discover undocumented behaviour
- Agents update existing spec pages when implementations diverge from the spec

The spec is primary, code is derived. If the spec is accurate enough, the application could be rebuilt from scratch.

## Code Health

Continuous quality monitoring and improvement.

- Code health is assessed via octoclean: cyclomatic complexity, cognitive complexity, test coverage, lines of code, duplication, churn × complexity
- Health scores (0-100) are factored into the [[behaviour-tree|behaviour tree's]] prioritisation
- Low health scores generate work candidates — agents can refactor, add tests, remove dead code
- Health must not regress — [[verification]] checks that scores don't drop after changes
- Permitted improvement actions: extract helpers, consolidate duplicates, update JSDoc, split large functions, rename symbols, remove dead exports
- High-fan-in files are marked off-limits to avoid cascading breakage

## Quality Assurance

Work is reviewed before it lands.

- The VERIFY tick runs adversarial review on completed work
- All tests must pass after every change — no exceptions
- If verification fails, changes are reverted — bad work never stays on the branch
- Verification checks intent alignment: does this change serve the project's goals as described in the wiki?
- Verification critiques become findings that future elves can action
- Multi-round review emerges naturally from the tick loop: if verify rejects, the next cycle's assess sees the gap and work tries again

## Behaviour Tree

How the system decides what to do — described fully in [[behaviour-tree]].

- Evaluated every tick, re-evaluates from scratch — cannot get stuck
- Four [[tick-types]]: ASSESS → PRIORITISE → WORK → VERIFY, cycling naturally
- Staleness-driven pacing — no fixed schedule, the system self-balances
- Two levels of priority: macro (tree structure, deterministic) and micro (LLM judgement in PRIORITISE)
- The prioritiser balances across work types: too many features without tests should shift priority to testing

## Installation and Setup

Getting started with shoe-makers on a new project.

- Install shoe-makers, run an init script that scaffolds `.shoe-makers/` in the repo
- The init script can bootstrap from existing docs (octowiki batch import)
- Customise the behaviour tree to match project priorities
- Configure via `.shoe-makers/config.yaml` (tick interval, staleness thresholds, enabled skills, branch prefix)
- Set up a [[scheduled-tasks|Claude Code scheduled task]] with a one-liner prompt: "Read .shoe-makers/protocol.md and follow it."
- The protocol is a living document — agents improve it as the system matures

## Self-Improvement

The system improves itself.

- Agents can modify the protocol, add scripts, create [[skills]], and update the wiki
- Skills are markdown files in `.shoe-makers/skills/` loaded by a registry
- The protocol evolves from manual instructions (bootstrap) to automated invocation (self-hosting)
- Every elf should leave the workshop in better shape than they found it
- Friction noticed by agents becomes scripts, skills, findings, or protocol improvements
