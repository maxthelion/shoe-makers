# New actions: `innovate` and `evaluate-insight`

The wiki and invariants have been updated to specify two new actions in the behaviour tree. Read these pages:

- `wiki/pages/creative-exploration.md` — full spec for the innovate and evaluate-insight actions
- `wiki/pages/behaviour-tree.md` — updated tree diagram
- `wiki/pages/architecture.md` — updated tree diagram
- `.shoe-makers/invariants.md` — sections 2.3 and 2.6

## What to build

### 1. `innovate` action
- New node in the tree: fires when innovation tier is detected (all invariants met, health good) and no insights or candidates exist
- The setup script must prepare a **deterministic creative brief**: read wiki overview pages and always fetch a random Wikipedia article, embed both in the prompt
- The prompt must mandate writing an insight file to `.shoe-makers/insights/YYYY-MM-DD-NNN.md`
- The elf has no choice about outputting — the brief frames the question, the elf answers it

### 2. `evaluate-insight` action
- New node in the tree: fires when insight files exist in `.shoe-makers/insights/`
- Has a **generous disposition** — builds on ideas, doesn't just filter them
- Separate from `prioritise` deliberately — the prioritise elf is pragmatic and would kill creative ideas
- Can promote (write work-item.md), rework (rewrite insight file), or dismiss (delete + log why)

### 3. Tree changes
The bottom of the tree changes to:
```
├── [candidates?]       -> prioritise
├── [insights exist?]   -> evaluate-insight
├── [innovation tier?]  -> innovate
└── [always]            -> explore (fallback, mainly for tiers 1-2)
```

### 4. Setup changes
- `insightCount` in `buildWorldState` is currently hardcoded to `0` — it must actually count files in `.shoe-makers/insights/`
- Add an `isInnovationTier()` helper (extract from the existing tier logic in prompts.ts)
- For `innovate`: always fetch Wikipedia article (bypass `shouldIncludeLens`), read wiki overview pages, embed in prompt
- `formatAction` must pass the article for `innovate`, not just `explore`

### 5. Prompt changes
- Remove the innovation-tier section from the `explore` prompt (it becomes dead code since explore no longer fires at tier 3)
- Remove insight evaluation instructions from the `prioritise` prompt (that's now evaluate-insight's job)
- Add `innovate` and `evaluate-insight` cases to `generatePrompt`

### 6. Types
- Add `"innovate" | "evaluate-insight"` to the `ActionType` union in `types.ts`

## Design doc
Full design spec is at `docs/superpowers/specs/2026-03-23-innovation-tier-design.md`.
