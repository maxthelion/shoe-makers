# Shoe-Makers

Autonomous AI agents that improve codebases overnight, like the elves in the fairy tale.

## What This Project Is

Shoe-makers is a behaviour tree system that runs on a regular tick (every 5 minutes). Each tick, it reads the world state (branch status, test results, invariant counts from the wiki spec) and routes to the appropriate pure-function agent. Agents write files to a dedicated branch and exit — all side effects (commit, push, merge) are handled by the scheduler.

## The Spec

**The wiki is the source of truth.** Read `wiki/pages/` to understand the architecture, design decisions, and what needs building. The wiki pages are the specification — code is derived from the spec.

Key pages:
- `wiki/pages/architecture.md` — overall system design
- `wiki/pages/behaviour-tree.md` — how the tree works (NPC model)
- `wiki/pages/pure-function-agents.md` — agents as pure functions
- `wiki/pages/wiki-as-spec.md` — why the wiki is primary
- `wiki/pages/invariants.md` — verifying spec against code
- `wiki/pages/plans-vs-spec.md` — plans are deltas, spec is facts
- `wiki/pages/branching-strategy.md` — one branch per night shift
- `wiki/pages/bootstrapping.md` — how we're building this

## How to Work on This Project

1. Read the wiki pages to understand what's specified
2. Read `src/` to understand what's built
3. Pick the most foundational unimplemented thing from the spec
4. Build it, write tests, commit to the shoemakers branch
5. After implementation, update the wiki if the spec needs to change

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Tests**: `bun test`
- **Wiki**: OctoWiki (run with `bun run wiki`, serves on port 4570)

## Project Structure

```
src/
  types.ts              — Core types (WorldState, TreeNode, Skill, etc.)
  tree/
    evaluate.ts         — Behaviour tree evaluator
    default-tree.ts     — Default tree definition
  scheduler/            — Tick loop, branch management
  skills/               — Skill implementations
  state/                — Blackboard, world state readers
  verify/               — Invariants pipeline, evidence checking
  config/               — Config loader (config.yaml parsing)
  creative/             — Wikipedia creative lens for explore cycles
  log/                  — Shift log and summary generation
  __tests__/            — Tests
wiki/
  pages/                — The specification (markdown + frontmatter)
```

## Conventions

- Agents are pure functions: input in, files out, no side effects
- The behaviour tree is deterministic — no LLM calls in routing
- Git branch is the state — no database, no task tracker
- Keep it simple — if it can be a condition check, don't make it an LLM call
