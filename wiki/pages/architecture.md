---
title: Architecture
category: architecture
tags: [architecture, core, behaviour-tree, scheduled-tasks]
summary: The core architecture — a behaviour tree protocol that runs via Claude Code scheduled tasks.
last-modified-by: user
---

## Core Insight

The system works like NPCs in games. A [[behaviour-tree]] is evaluated every 5 minutes against the current world state. The path through the tree determines which [[pure-function-agents|pure-function agent]] to invoke. No central diagnoser needed — the tree structure encodes priority.

This can run via [[scheduled-tasks|Claude Code scheduled tasks]] (cloud) or a local cron. The execution layer is separate from the intelligence layer.

## Architecture

### The Tick (every 5 minutes)

1. Read world state (branch status, test results, code health, git log)
2. Walk the [[behaviour-tree]]
3. First matching condition → invoke the corresponding agent
4. Agent writes files to the shoemakers branch
5. Agent exits
6. Scheduler handles side effects (commit, push, test, merge/revert)

### The Behaviour Tree

```
Root (selector — pick first applicable)
├── Is there a failing test on the shoemakers branch? → FixAgent
├── Is there unfinished work on the branch? → ContinueAgent
├── Is there a code health score below threshold? → CleanAgent
├── Is there an uncovered code path? → TestAgent
├── Is there a stale wiki page? → DocAgent
├── Nothing to do → Sleep
```

Routing is **fully deterministic** — just condition checks, no LLM call. The LLM only fires when an agent actually does work.

### Pure Function Agents

Agents are [[pure-function-agents|pure functions]] (the best idea from Octopoid):
- Receive: read-only repo snapshot + job description
- Produce: file changes on the shoemakers branch
- Side effects: **none** — the scheduler handles commits, pushes, PRs

### The Shoemakers Branch

The branch IS the state. No database, no task tracker.
- Unfinished work = partial changes on the branch
- Completed work = clean commits ready for review
- Failed work = revert, branch returns to previous state

### What Lives in the Repo

```
.shoe-makers/
  tree.yaml            # the behaviour tree definition
  skills/
    octoclean-fix.md   # skill: improve code health scores
    test-coverage.md   # skill: add tests for uncovered paths
    doc-sync.md        # skill: sync wiki with code
    bug-fix.md         # skill: attempt fixes for open issues
  contracts/
    architecture.md    # what the agent must not violate
    style.md           # what "good" looks like
  verify.md            # adversarial verification instructions
  config.yaml          # which skills are enabled, risk tolerance
```

See also: [[behaviour-tree]], [[pure-function-agents]], [[existing-projects]], [[skills]], [[verification]], [[scheduled-tasks]]
