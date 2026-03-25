# Shoe-Makers

Autonomous AI agents that proactively improve codebases overnight, like the elves in the Brothers Grimm fairy tale.

Set it up on a project, point a scheduled task at it, and wake up to a branch with genuine improvements — features implemented, tests added, docs synced, code health improved, all reviewed adversarially.

## How it works

Shoe-makers uses a **behaviour tree** inspired by game AI. Each scheduled invocation does one thing and exits. The tree evaluates against the world state and picks the most important action.

```
Selector
├── [tests failing?]         → Fix tests
├── [review-loop ≥3?]        → Break out to explore
├── [unresolved critiques?]  → Fix issues flagged by reviewer
├── [unreviewed commits?]    → Adversarial review of previous elf's work
├── [uncommitted changes?]   → Review uncommitted work
├── [inbox messages?]        → Handle human instructions
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the detailed work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [insights exist?]        → Evaluate insight (generous disposition)
├── [innovation tier?]       → Innovate: creative brief with Wikipedia lens
└── [always true]            → Explore: assess the codebase, write candidates.md
```

**Reactive conditions** (top) handle urgent work with direct prompts. **Three-phase orchestration** (bottom) handles proactive work across separate invocations:

1. **Explore** — broad context. Read the wiki, code, invariants, health scores, findings. Write a ranked list of candidates.
2. **Prioritise** — medium context. Read the candidates, read the relevant code and wiki. Pick one and write a detailed work item with full context — not "implement something" but specific instructions with relevant code and patterns.
3. **Execute** — narrow context. Read the work item. Do exactly what it says. Commit. Optionally hand off a follow-up (e.g. "review what I just built").

At **innovation tier** (all invariants met, health good), the tree routes to **Innovate** instead of Explore. The setup script prepares a creative brief with a random Wikipedia article, and the elf writes an insight connecting the random concept to the system. A separate **Evaluate-insight** action fires when insight files exist — it has a generous disposition, building on ideas constructively rather than filtering them. Evaluated insights are either promoted to work items, reworked with feedback, or dismissed with a note explaining why.

Each phase narrows the context for the next. The prioritiser's job is to write a really good prompt for the executor.

**Partial work** handles the case where an agent runs out of time mid-task. The agent writes a handoff file (`.shoe-makers/state/partial-work.md`) describing what's done and what remains. The next tick detects this and routes to a continue-work agent that picks up where the previous elf left off — no work is lost to timeouts.

## The wiki is the spec

The wiki (`wiki/pages/`) is the source of truth. Code is derived from the spec, not the other way around. When wiki and code diverge, check which changed more recently — if the wiki is newer, change the code. Never revert the wiki to match existing code.

**Invariants** (`.shoe-makers/invariants.md`) are human-written falsifiable claims about the system. The invariants checker compares them against the code and surfaces gaps — specified-only (wiki says it, code doesn't do it), implemented-untested (code exists, no tests), unspecified (code does it, wiki doesn't mention it). These gaps drive the behaviour tree's proactive work.

## Quality assurance

- **Cross-elf gatekeeping**: a different elf reviews each elf's commits adversarially. The reviewer knows what rules the previous elf was given and checks compliance.
- **Critiques become findings**: blocking issues must be fixed before new work starts.
- **Tests must pass**: every change, no exceptions.
- **Automated verification gate**: setup auto-reverts the elf's last commit if tests fail or code health regresses — bad work is caught before the review cycle even starts.
- **Code health**: octoclean monitors complexity, coverage, and duplication. Health must not regress.
- **Role-based permissions**: each action type has a role determining what files the elf can write. Reviewers can only write findings. Invariants are human-only.

## Branches and shifts

All work happens on a daily branch (e.g. `shoemakers/2026-03-22`). Nothing reaches main without human approval. In the morning, review the branch and merge, cherry-pick, or discard.

The shift log (`.shoe-makers/log/`) tells the story of the night's work, including a summary dashboard that categorises actions (fix, feature, test, docs, health, review) and tracks process patterns like reactive ratio and review loop counts. Findings (`.shoe-makers/findings/`) persist across shifts for continuity.

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
health-regression-threshold: 2
review-loop-threshold: 3
wikipedia-timeout: 10000
octoclean-timeout: 120000
```

`.shoe-makers/schedule.md` (optional — restricts elves to a working window, UTC 24h format):
```
start: 22
end: 6
```

Setup exits immediately outside these hours, so the elves only work during the configured window.

## Project structure

```
.shoe-makers/
  protocol.md           # Instructions for the elf
  config.yaml           # Settings with sensible defaults
  invariants.md         # Human-written spec claims (authoritative)
  claim-evidence.yaml   # Evidence patterns for invariant verification
  schedule.md           # Working hours (optional)
  skills/               # Markdown skill prompts
  state/                # Ephemeral state (assessment, candidates, work items)
  log/                  # Shift logs
  findings/             # Persistent observations
  insights/             # Creative proposals from analogical prompting
  inbox/                # Messages from humans
  archive/              # Archived state files and resolved findings
  known-issues.md       # Troubleshooting

src/                    # The behaviour tree system
wiki/pages/             # The specification
```

## Background

Blog posts:
- [The Elves and the Shoemaker](https://blog.maxthelion.me/blog/shoe-maker-elves/) — the vision
- [Defining the Source of Truth](https://blog.maxthelion.me/blog/defining-the-source-of-truth/) — why the wiki is primary

Built on: [OctoWiki](https://github.com/maxthelion/octowiki) (wiki), [Octoclean](https://github.com/maxthelion/octoclean) (code health). Lessons learned from [Octopoid](https://github.com/maxthelion/octopoid) (don't build state machines).
