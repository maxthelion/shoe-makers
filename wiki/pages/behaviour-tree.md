---
title: Behaviour Tree
category: architecture
tags: [behaviour-tree, core, npc, game-ai, scheduler]
summary: The behaviour tree — reactive conditions for urgent work, three-phase orchestration for proactive work.
last-modified-by: user
---

## The NPC Model

The shoe-makers system works like NPCs in games. Each invocation, the behaviour tree is evaluated against the world state. The first matching condition determines what the elf does. The elf does ONE thing and exits. The next invocation evaluates the tree again.

One invocation, one action, one exit. The scheduled task interval provides the loop.

## The Tree

The tree has two zones: **reactive** conditions at the top (urgent, handled directly) and a **three-phase orchestration** at the bottom (proactive work).

```
Selector
├── [tests failing?] → Fix tests (direct prompt)
├── [review-loop ≥3?] → Break out to explore (circuit breaker)
├── [unresolved critiques?] → Fix critiques (direct prompt)
├── [partial work?] → Continue partial work (direct prompt)
├── [unreviewed commits?] → Review adversarially (direct prompt)
├── [uncommitted changes?] → Review uncommitted work (direct prompt)
├── [inbox messages?] → Handle inbox (direct prompt)
├── [dead-code work-item?] → Remove dead code
├── [work-item.md exists?] → Execute it
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight (generous disposition)
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

### Reactive zone (top)

These fire immediately with a direct prompt. No orchestration needed — the action is obvious.

- **Tests failing** — always highest priority. The elf gets the test output and fixes it.
- **Review-loop circuit breaker** — if the review loop has fired 3+ times this shift, break out to explore to reassess rather than continuing the loop.
- **Unresolved critiques** — blocking findings from a previous reviewer. Must fix before new work.
- **Partial work** — a previous elf started work but didn't finish. The elf reads the partial-work description and resumes where the previous elf left off.
- **Unreviewed commits** — a previous elf's commits need adversarial review. The reviewer gets the diff and the rules the previous elf was given.
- **Uncommitted changes** — review uncommitted work before proceeding with new actions.
- **Inbox messages** — human instructions take priority over self-directed work.

### Three-phase orchestration (bottom)

Proactive work goes through three phases across three separate invocations:

**1. Explore** — broad context, produces a candidate list.
The elf reads everything: wiki, code, findings, invariants, health scores. It produces `.shoe-makers/state/candidates.md` — a ranked list of possible work items with reasoning about why each matters. This is where the elf discovers what needs doing.

**2. Prioritise** — medium context, produces one detailed work item.
The elf reads the candidate list, reads the relevant wiki pages and source files for the top candidates, and picks one. It writes `.shoe-makers/state/work-item.md` — a specific, detailed prompt with full context: the relevant wiki text, the relevant code, exactly what to build, which patterns to follow. This is the orchestrator that writes really good instructions.

**3. Execute** — narrow context, does the work.
The elf reads `work-item.md` and does exactly what it says. It commits and optionally writes a new `work-item.md` for the next elf (e.g. "review what I just built" or "write tests for this feature"). This creates a natural handoff chain.

### Why three phases?

Each phase narrows the context for the next:
- Explore reads everything → produces a list
- Prioritise reads the list + relevant code → produces one detailed instruction
- Execute reads one instruction → does one thing

This solves the problem of elves getting generic prompts. The prioritiser's entire job is to write a specific, detailed prompt — it reads the wiki, looks at the code, and tells the executor exactly what to build and how. The executor doesn't need to figure out what to work on.

### State files

```
.shoe-makers/state/
  assessment.json   ← cached world state, read by tree conditions
  candidates.md     ← written by explore, read by prioritise
  work-item.md      ← written by prioritise (or by executor as handoff), read by executor
  partial-work.md   ← written by agent on partial exit, read by continue-work
  last-action.md    ← copy of previous action, read by reviewer
```

After execution, `work-item.md` is consumed (deleted or replaced with a follow-up). After prioritisation, `candidates.md` is consumed. This ensures the cycle advances: explore → prioritise → execute → (explore again when no items remain).

## Hierarchy of Needs

The system follows a hierarchy of needs. Lower tiers must be satisfied before higher tiers become the focus. The reactive tier is enforced by tree order. The proactive tiers are enforced by the explore and prioritise prompts, which receive the current invariant counts and shift behaviour accordingly.

**Reactive conditions** have fixed priority encoded in tree order. Tests always beat critiques, critiques always beat reviews, reviews always beat inbox.

### Tier 1: Hygiene (reactive + proactive)

Tests passing, critiques resolved, code reviewed, inbox handled. Enforced by tree order — these fire before any proactive work. Also includes: spec-code inconsistencies, code smells, stale documentation, broken invariants. If the codebase is messy, clean it up before building new things.

### Tier 2: Implementation (proactive, directed)

Build things that have been discussed but not actioned. Spec claims that aren't implemented (`specified-only` invariants), wiki plans that are open, features the wiki describes but the code doesn't have. This is directed work — the intent already exists in the spec, it just hasn't been built yet.

The explore elf should surface these as candidates. The prioritise elf should prefer them over test-only or health-only work when the codebase is in good shape.

### Tier 3: Innovation (proactive, creative — dedicated actions)

At tier 3, the tree routes to dedicated `innovate` and `evaluate-insight` actions instead of `explore`. This is where the Wikipedia creative lens and analogical thinking live.

The `innovate` action receives a **deterministic creative brief** from the setup script: a summary of the system (from the wiki) and a random Wikipedia article. The elf must write an insight file connecting the two. It cannot opt out — the brief is mandatory and output is mandatory.

The `evaluate-insight` action fires when insight files exist. It has a **generous disposition** — separate from the pragmatic `prioritise` action — and builds on ideas rather than filtering them. See [[creative-exploration]] for the full lifecycle.

The explore action only fires at tier 3 as a fallback if neither innovate nor evaluate-insight applies (which shouldn't happen in normal operation).

### How the tiers interact

The explore elf determines which tier the system is currently in by reading the invariant counts and health scores. It then produces candidates appropriate to that tier:

- Many gaps or failures → tier 1 candidates (fixes, cleanups, consistency)
- Spec claims unimplemented → tier 2 candidates (implementation, wiring)
- Everything green → tier 3 candidates (UX improvements, creative refactoring, ergonomics for humans and agents)

The prioritise elf receives the same tier signal and picks accordingly. Impact is the primary criterion — not risk-avoidance.

## Review as Handoff

After executing work, the elf can write a new `work-item.md` that says "review my last commit." The next invocation sees `work-item.md exists` and the elf gets a review prompt. This is how adversarial review happens for proactive work — not as a tree condition, but as a handoff from the executor.

For reactive work (fixing tests, handling inbox), the unreviewed-commits condition catches it on the next cycle.

## Branch as State

The branch is the state — no database, no task tracker. State files are ephemeral on the branch. Delete the branch and start clean.

See also: [[pure-function-agents]], [[invariants]], [[verification]], [[skills]]
