---
title: Integration Guide
category: spec
tags: [integration, setup, installation, claude-code, scheduled-tasks]
summary: How to include shoe-makers in another project and set it up in the Claude Code cloud environment.
last-modified-by: user
---

## Installing in a Project

```bash
# From the target project root
bun add shoe-makers     # or install globally
bun run init            # scaffolds .shoe-makers/
```

The init command creates:
- `.shoe-makers/protocol.md` — instructions for each elf
- `.shoe-makers/config.yaml` — sensible defaults
- `.shoe-makers/invariants.md` — empty, for humans to fill in
- `.shoe-makers/skills/` — default skill prompts (implement, fix-tests, test-coverage, doc-sync, health)
- `.shoe-makers/inbox/`, `findings/`, `insights/`, `log/`, `state/` — working directories

Optionally, `bootstrapWiki` imports existing markdown docs into `wiki/pages/` so the system has a spec to work from on day one.

## Claude Code Cloud Environment

The scheduled task runs in a Claude Code cloud environment. Configuration has three parts:

### 1. Setup Script

Runs before Claude Code starts. Handles branch checkout and tree evaluation:

```bash
#!/bin/bash
bun install
bun run setup
```

The setup script:
- Fetches and checks out today's shoemakers branch (or creates it from main)
- Runs the assessment (tests, invariants, health, plans, findings)
- Evaluates the behaviour tree
- Writes a focused prompt to `.shoe-makers/state/next-action.md`

### 2. Prompt

```
You are a shoe-maker elf. Read .shoe-makers/state/next-action.md and do what it says.
When done, run `bun run setup` to get your next action. Repeat until time runs out.
Log your work to .shoe-makers/log/.
```

The elf reads a narrow, scoped prompt for each action. It doesn't need to understand the whole shoe-makers system — just follow the instructions.

### 3. Schedule

Set the schedule in the Claude Code UI. Hourly is a good starting point — each invocation does one action.

Optionally, `.shoe-makers/schedule.md` restricts working hours:
```
start: 22
end: 6
```

## What Happens on the First Run

1. Setup creates `shoemakers/YYYY-MM-DD` branch from main
2. No assessment exists → tree routes to **explore**
3. Elf reads the wiki, code, invariants. Writes `candidates.md`
4. Next invocation: tree routes to **prioritise**
5. Elf picks the most impactful candidate, writes a detailed `work-item.md`
6. Next invocation: tree routes to **execute**
7. Elf does the work, commits
8. Next invocation: tree routes to **review** (unreviewed commits)
9. Elf reviews adversarially, writes a critique finding
10. Cycle continues

## What You Need to Provide

- **A wiki** (`wiki/pages/`) describing what your project does. The more detailed the spec, the better the elves know what to build. Use `bootstrapWiki` to get started from existing docs.
- **Invariants** (`.shoe-makers/invariants.md`) — falsifiable claims about the system. Start with high-level functionality ("users can log in", "the API returns paginated results") and add detail over time. Claims without matching code surface as work for the elves.
- **Tests** — elves run `bun test` (or whatever your test command is). If there are no tests, elves can write them but have nothing to verify against.

## Configuration

`.shoe-makers/config.yaml`:

| Key | Default | Description |
|-----|---------|-------------|
| `branch-prefix` | `shoemakers` | Branch name prefix |
| `tick-interval` | `5` | Minutes between ticks (informational) |
| `wiki-dir` | `wiki` | Path to wiki directory |
| `assessment-stale-after` | `30` | Minutes before assessment needs refreshing |
| `insight-frequency` | `0.3` | Fraction of explore cycles with Wikipedia lens |
| `enabled-skills` | all | Comma-separated list of enabled skills |

## Communicating with Elves

- **Inbox** (`.shoe-makers/inbox/`): drop a `.md` file, next elf acts on it with priority
- **Plans**: add a wiki page with `category: plan` in frontmatter
- **Invariants**: edit `.shoe-makers/invariants.md` — new claims surface as gaps automatically
- **Config**: adjust priorities, working hours, enabled skills

## Morning Review

1. Check the shoemakers branch: `git log main..shoemakers/YYYY-MM-DD --oneline`
2. Read the shift log: `.shoe-makers/log/YYYY-MM-DD.md`
3. Check findings: `.shoe-makers/findings/`
4. If happy: merge to main
5. If not: cherry-pick what's good, discard the rest

See also: [[behaviour-tree]], [[architecture]], [[scheduled-tasks]]
