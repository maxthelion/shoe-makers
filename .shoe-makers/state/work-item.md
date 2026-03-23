# Update CLAUDE.md project structure

## Context

CLAUDE.md's project structure section (lines 40-52) is outdated. It's missing several directories that now exist in `src/`:
- `config/` — Config loader (`load-config.ts`)
- `creative/` — Wikipedia creative lens (`wikipedia.ts`)
- `state/` — Blackboard and world state readers
- `log/` — Shift log and summary generation

## What to change

Edit `CLAUDE.md`, lines 40-52. Replace the project structure with:

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

## What NOT to change

- Do NOT modify any source code
- Do NOT change the wiki pages
- Only update the project structure diagram in CLAUDE.md
