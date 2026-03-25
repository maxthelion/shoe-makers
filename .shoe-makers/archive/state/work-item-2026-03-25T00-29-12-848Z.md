# Update README tree diagram and three-phase description

skill-type: doc-sync

## Context

The README.md tree diagram and three-phase orchestration description are out of date. The actual behaviour tree has 11 nodes but the README only shows 9.

### What the README currently shows (lines 17-27)

```
├── [tests failing?]         → Fix tests
├── [unresolved critiques?]  → Fix issues flagged by reviewer
├── [unreviewed commits?]    → Adversarial review of previous elf's work
├── [uncommitted changes?]   → Review uncommitted work
├── [inbox messages?]        → Handle human instructions
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the detailed work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [always true]            → Explore: assess the codebase, write candidates.md
```

### What the actual tree is (from `src/tree/default-tree.ts`)

```
├── [tests failing?]         → Fix tests
├── [unresolved critiques?]  → Fix issues flagged by reviewer
├── [unreviewed commits?]    → Adversarial review
├── [uncommitted changes?]   → Review uncommitted work
├── [inbox messages?]        → Handle human instructions
├── [dead-code work-item?]   → Remove dead code
├── [work-item.md exists?]   → Execute the detailed work item
├── [candidates.md exists?]  → Prioritise: pick one, write work-item.md
├── [insights exist?]        → Evaluate insight (generous disposition)
├── [innovation tier?]       → Innovate: creative insight from random concept
└── [always true]            → Explore: assess the codebase, write candidates.md
```

### The three-phase description needs updating

The README describes Explore, Prioritise, Execute but doesn't mention:
- **Innovate** — fires at innovation tier instead of explore, uses Wikipedia article for creative collision
- **Evaluate-insight** — fires when insight files exist, generous evaluator that builds on ideas

## What to build

1. **Replace the tree diagram** in `README.md` lines 17-27 with the 11-node version above

2. **Update the three-phase description** (currently lines 33-40). After the existing 3 phases, add mention of Innovate and Evaluate-insight:
   - Innovate fires at tier 3 instead of explore, with a Wikipedia creative brief
   - Evaluate-insight fires when insight files exist, with a generous disposition

3. **Keep changes minimal** — only update the tree diagram and add the innovate/evaluate-insight mentions. Don't rewrite other sections.

## What NOT to change

- Don't modify any source code
- Don't modify `.shoe-makers/invariants.md`
- Don't add or change configuration examples
- Don't modify the Getting Started, Project Structure, or Background sections unless they directly reference the old tree

## Verification

- The tree diagram in README matches the tree in `src/tree/default-tree.ts`
- `bun test` still passes
- No other sections were unnecessarily changed

## Decision Rationale

Candidate #1 was chosen over #2 (innovate prompt completeness) and #3 (subsection numbering bug) because it's the most visible spec violation — the README is the first thing users see. All invariants are met, so this is improvement work, not gap-closing. Candidates #4 and #5 are lower impact.
