# Add claim-evidence for 14 hierarchy-of-needs invariants

skill-type: implement

## Context

The wiki specifies a 3-tier hierarchy (hygiene → implementation → innovation) and creative exploration behaviors. The code in `src/prompts.ts` implements all of these, but `.shoe-makers/claim-evidence.yaml` has no entries matching these 14 claim IDs. The invariant checker reports them as "specified-only" even though the features exist.

## What to do

### Part 1: Add evidence to `.shoe-makers/claim-evidence.yaml`

Append the following entries to the end of the file (before any trailing whitespace). Each claim ID must match exactly.

**Hierarchy-of-needs claims** — these are implemented in `src/prompts.ts`:

1. `spec.the-prioritiser-writes-the-real-prompt.this-is-the-llm-judgement-step-it-weighs-impact-and-balance-`
   - Source: look for `pTierGuidance` and `highest impact` in prompts.ts
   - Test: look for `tierGuidance` or `highest impact` in prompts.test.ts

2. `spec.hierarchy-of-needs-in-prioritisation.the-system-follows-three-tiers-hygiene-implementation-innova`
   - Source: look for `Hygiene` and `Innovation` in prompts.ts
   - Test: look for `Hygiene` or `Innovation` in prompts.test.ts

3. `spec.hierarchy-of-needs-in-prioritisation.tier-1-hygiene-speccode-inconsistencies-code-smells-broken-i`
   - Source: look for `Hygiene / Implementation` in prompts.ts
   - Test: look for `Hygiene` in prompts.test.ts

4. `spec.hierarchy-of-needs-in-prioritisation.tier-2-implementation-build-things-discussed-but-not-actione`
   - Source: look for `unimplemented spec claim` in prompts.ts
   - Test: look for `unimplemented` in prompts.test.ts

5. `spec.hierarchy-of-needs-in-prioritisation.tier-3-innovation-actively-improve-beyond-instructions-ux-fo`
   - Source: look for `Innovation` and `improvement-finding` in prompts.ts
   - Test: look for `Innovation` in prompts.test.ts

6. `spec.hierarchy-of-needs-in-prioritisation.the-explore-and-prioritise-prompts-receive-invariant-counts-`
   - Source: look for `specifiedOnly` and `eHasGaps` and `pHasGaps` in prompts.ts
   - Test: look for `specifiedOnly` in prompts.test.ts

7. `spec.hierarchy-of-needs-in-prioritisation.no-impactful-work-remaining-is-never-acceptable-output-at-ti`
   - Source: look for `No impactful work remaining` in prompts.ts
   - Test: look for `No impactful work` in prompts.test.ts

8. `spec.hierarchy-of-needs-in-prioritisation.at-tier-3-elves-should-ask-could-this-system-be-easier-for-h`
   - Source: look for `easier to use` in prompts.ts
   - Test: look for `easier` in prompts.test.ts

9. `spec.hierarchy-of-needs-in-prioritisation.impact-is-the-primary-criterion-not-riskavoidance`
   - Source: look for `highest impact` in prompts.ts
   - Test: look for `impact` in prompts.test.ts

10. `spec.creative-exploration.the-explore-elf-reads-the-codebase-through-the-lens-and-writ`
    - Source: look for `Creative Lens` and `article.title` in prompts.ts
    - Test: look for `Creative Lens` or `article` in prompts.test.ts

11. `spec.creative-exploration.the-prioritise-elf-evaluates-insights-critically-not-just-tr`
    - Source: look for `engage with the idea critically` in prompts.ts
    - Test: look for `critically` or `insight` in prompts.test.ts

12. `spec.creative-exploration.the-evaluator-can-promote-viable-work-item-rework-rewrite-th`
    - Source: look for `Promote` and `Rework` and `Dismiss` in prompts.ts
    - Test: look for `Promote` or `Rework` in prompts.test.ts

13. `spec.creative-exploration.good-evaluation-improves-ideas-not-just-filters-them-the-raw`
    - Source: look for `improves ideas` in prompts.ts
    - Test: look for `improves ideas` or `filters` in prompts.test.ts

14. `spec.creative-exploration.the-separation-between-generating-insights-divergent-and-eva`
    - Source: look for `creative mode` and `evaluative mode` in prompts.ts
    - Test: look for `creative` or `evaluative` in prompts.test.ts

### Part 2: Add tests to `src/__tests__/prompts.test.ts`

Add a new `describe` block for tier logic tests:

```typescript
describe("explore and prioritise tier switching", () => {
  // Test: explore prompt shows Innovation tier when no gaps
  // Use a WorldState with specifiedOnly=0, implementedUntested=0
  // Check output contains "Innovation" and "improvement-finding"

  // Test: explore prompt shows Hygiene/Implementation tier when gaps exist
  // Use specifiedOnly=5
  // Check output contains "Hygiene / Implementation" and "unimplemented spec claim"

  // Test: prioritise prompt shows gap guidance when gaps exist
  // Check output contains "unimplemented spec claim"

  // Test: prioritise prompt shows innovation guidance when no gaps
  // Check output contains "highest impact"

  // Test: explore Innovation tier says "No impactful work remaining" is not acceptable
  // Check output contains "No impactful work remaining"

  // Test: prioritise prompt includes insight evaluation instructions
  // Check output contains "Promote" and "Rework" and "Dismiss"
  // Check output contains "improves ideas"
});
```

Follow the existing pattern in `src/__tests__/prompts.test.ts` for how to construct WorldState and call `generatePrompt()`.

### Part 3: Verify

Run `bun test` — all tests must pass including the new ones.

## Do NOT change

- `src/prompts.ts` — the features are already implemented, we're just adding evidence and tests
- `.shoe-makers/invariants.md`
- Wiki pages
- Any other source files
