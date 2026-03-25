# Shoe-Makers

Autonomous AI agents that proactively improve codebases overnight, like the elves in the Brothers Grimm fairy tale.

Set it up on a project, point a scheduled task at it, and wake up to a branch with genuine improvements — features implemented, tests added, docs synced, code health improved, all reviewed adversarially.

## How it works

Shoe-makers uses a **behaviour tree** inspired by game AI. Each scheduled invocation does one thing and exits. The tree evaluates against the world state and picks the most important action.

```
Selector
├── [tests failing?]         → Fix tests
├── [unresolved critiques?]  → Fix issues flagged by reviewer
├── [unreviewed commits?]    → Adversarial review of previous elf's work
├── [uncommitted changes?]   → Review uncommitted work
├── [inbox messages?]        → Handle human instructions
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the detailed work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [insights exist?]        → Evaluate insight (generous/convergent)
├── [innovation tier?]       → Innovate: creative brief with Wikipedia lens
└── [always true]            → Explore: assess the codebase, write candidates.md
```

**Reactive conditions** (top) handle urgent work with direct prompts. **Three-phase orchestration** (bottom) handles proactive work across separate invocations:

1. **Explore** — broad context. Read the wiki, code, invariants, health scores, findings. Write a ranked list of candidates. Occasionally prompted with a random Wikipedia article as an analogical lens for creative thinking.
2. **Prioritise** — medium context. Read the candidates, read the relevant code and wiki. Pick one and write a detailed work item with full context — not "implement something" but specific instructions with relevant code and patterns.
3. **Execute** — narrow context. Read the work item. Do exactly what it says. Commit. Optionally hand off a follow-up (e.g. "review what I just built").

Each phase narrows the context for the next. The prioritiser's job is to write a really good prompt for the executor.

When all invariants are met and code health is good, the system enters the **innovation tier**: prompted with a random Wikipedia article as an analogical lens, the elf writes a creative insight. A separate evaluation phase (generous/convergent disposition) decides whether to promote the insight to a work item, rework it, or dismiss it.

## The wiki is the spec

The wiki (`wiki/pages/`) is the source of truth. Code is derived from the spec, not the other way around. When wiki and code diverge, check which changed more recently — if the wiki is newer, change the code. Never revert the wiki to match existing code.

**Invariants** (`.shoe-makers/invariants.md`) are human-written falsifiable claims about the system. The invariants checker compares them against the code and surfaces gaps — specified-only (wiki says it, code doesn't do it), implemented-untested (code exists, no tests), unspecified (code does it, wiki doesn't mention it). These gaps drive the behaviour tree's proactive work.

## Quality assurance

- **Cross-elf gatekeeping**: a different elf reviews each elf's commits adversarially. The reviewer knows what rules the previous elf was given and checks compliance.
- **Critiques become findings**: blocking issues must be fixed before new work starts.
- **Tests must pass**: every change, no exceptions.
- **Code health**: octoclean monitors complexity, coverage, and duplication. Health must not regress.
- **Role-based permissions**: each action type has a role determining what files the elf can write. Reviewers can only write findings. Invariants are human-only.

## Branches and shifts

All work happens on a daily branch (e.g. `shoemakers/2026-03-22`). Nothing reaches main without human approval. In the morning, review the branch and merge, cherry-pick, or discard.

The shift log (`.shoe-makers/log/`) tells the story of the night's work. Findings (`.shoe-makers/findings/`) persist across shifts for continuity.

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+

### Install in a project

```bash
bun run init
```

Scaffolds `.shoe-makers/` with protocol, config, skills, and directory structure. Optionally bootstraps a wiki from existing docs.

### Set up a scheduled task

**Setup script** (runs before each invocation):
```bash
#!/bin/bash
bun install
bun run setup
```

**Prompt**:
```
You are a shoe-maker elf. Read .shoe-makers/state/next-action.md and do what it says.
When done, run `bun run setup` to get your next action. Repeat until time runs out.
Log your work to .shoe-makers/log/.
```

### Run locally

```bash
bun run setup          # Evaluate the tree, write next-action.md
bun run tick           # Run one tick of the behaviour tree
bun run shift          # Run a full shift (multiple ticks in sequence)
bun test               # Run tests
bun run wiki           # Start octowiki on port 4570
```

### Communicate with the elves

- **Inbox**: drop a `.md` file in `.shoe-makers/inbox/` — the next elf reads it with priority
- **Plans**: add a wiki page with `category: plan` — elves work toward implementing it
- **Invariants**: edit `.shoe-makers/invariants.md` — new claims surface as gaps automatically

### Configuration

`.shoe-makers/config.yaml`:

```yaml
branch-prefix: shoemakers
tick-interval: 5
wiki-dir: wiki
assessment-stale-after: 30
max-ticks-per-shift: 10
enabled-skills: fix-tests, implement, test-coverage, doc-sync, health  # omit to enable all
insight-frequency: 0.3
max-innovation-cycles: 3
```

`.shoe-makers/schedule.md` (optional):
```
start: 22
end: 6
```

## Project structure

```
.shoe-makers/
  protocol.md           # Instructions for the elf
  config.yaml           # Settings with sensible defaults
  invariants.md         # Human-written spec claims (authoritative)
  schedule.md           # Working hours (optional)
  skills/               # Markdown skill prompts
  state/                # Ephemeral state (assessment, candidates, work items)
  log/                  # Shift logs
  findings/             # Persistent observations
  insights/             # Creative proposals from analogical prompting
  inbox/                # Messages from humans
  archive/              # Archived state files for traceability
  claim-evidence.yaml   # Evidence patterns for invariant verification
  known-issues.md       # Troubleshooting

src/                    # The behaviour tree system
wiki/pages/             # The specification
```

## Background

Blog posts:
- [The Elves and the Shoemaker](https://blog.maxthelion.me/blog/shoe-maker-elves/) — the vision
- [Defining the Source of Truth](https://blog.maxthelion.me/blog/defining-the-source-of-truth/) — why the wiki is primary

Built on: [OctoWiki](https://github.com/maxthelion/octowiki) (wiki), [Octoclean](https://github.com/maxthelion/octoclean) (code health). Lessons learned from [Octopoid](https://github.com/maxthelion/octopoid) (don't build state machines).
