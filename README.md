# Shoe-Makers

Autonomous AI agents that improve codebases overnight, like the elves in the fairy tale.

## What it does

Shoe-makers is a behaviour tree system that runs on a regular tick (every 5 minutes). Each tick, it reads the world state (branch status, test results, invariant counts) and routes to the appropriate pure-function agent. Agents write files to a dedicated branch and exit — all side effects (commit, push, merge) are handled by the scheduler.

## Current status

The core tick loop is working:

- **Behaviour tree evaluator** — deterministic routing based on world state
- **World state reader** — reads git branch, blackboard state, config
- **All four tick types**: assess, prioritise, work, verify
- **Blackboard I/O** — reads/writes JSON state files in `.shoe-makers/state/`
- **Bootstrap invariants** — structural comparison of wiki spec vs code
- **Skill registry** — loads markdown skill prompts from `.shoe-makers/skills/`
- **Shift logging** — appends to `.shoe-makers/log/YYYY-MM-DD.md`
- **Config loader** — reads `.shoe-makers/config.yaml` with sensible defaults

The system can run a full cycle: assess → prioritise → (work → verify) → sleep.

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+

### Run one tick

```bash
bun run tick
```

This evaluates the behaviour tree, invokes the appropriate skill, and logs the result.

### Run a full shift

```bash
bun run shift
```

Runs multiple ticks in sequence. Housekeeping ticks (assess, prioritise, verify) execute automatically. When the tree routes to "work", the shift pauses and prints instructions for the caller. When there's nothing to do, it stops with "sleep".

### Manage the current task

```bash
bun run task:status   # Show current task details and instructions
bun run task:done     # Mark current task as completed
bun run task:fail     # Mark current task as failed
```

After marking a task done or failed, run `bun run shift` again to trigger verification.

### Run tests

```bash
bun test
```

### Project structure

```
src/
  types.ts              — Core types (WorldState, TreeNode, Skill, etc.)
  index.ts              — Entry point (reads state, ticks, invokes skill, logs)
  tree/
    evaluate.ts         — Behaviour tree evaluator
    default-tree.ts     — Default tree definition
  scheduler/
    tick.ts             — Pure tick function (tree evaluation)
    run-skill.ts        — Skill dispatcher
  skills/
    assess.ts           — Gather world information
    prioritise.ts       — Generate and rank work items
    work.ts             — Pick top priority, set up task
    verify.ts           — Check work, decide commit/revert
    registry.ts         — Load skill markdown files
  state/
    blackboard.ts       — Read/write blackboard JSON files
    world.ts            — Assemble WorldState
  config/
    load-config.ts      — Load .shoe-makers/config.yaml
  verify/
    invariants.ts       — Bootstrap invariants checker
  log/
    shift-log.ts        — Append to shift log
  task.ts               — Task lifecycle CLI (status/done/fail)
  __tests__/            — Tests (93 tests)

.shoe-makers/
  protocol.md           — Bootstrap instructions for scheduled tasks
  skills/               — Skill prompts (markdown)
  state/                — Blackboard JSON files (ephemeral)
  log/                  — Shift logs (append-only)
  findings/             — Persistent observations for future elves

wiki/
  pages/                — The specification (markdown + frontmatter)
```

## The spec

The wiki (`wiki/pages/`) is the source of truth. Code is derived from the spec.

## How the behaviour tree works

```
Root (selector — pick first applicable)
├── Is assessment stale? → Assess
├── Is assessment newer than priorities? → Prioritise
├── Is there completed work to verify? → Verify
├── Is there a top priority to work on? → Work
└── Sleep
```

Each tick re-evaluates from the root. The tree cannot get stuck because it re-evaluates from scratch every time.
