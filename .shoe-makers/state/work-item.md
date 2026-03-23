skill-type: implement

# Wire claim-evidence for innovate and evaluate-insight invariants

## Context

The innovate and evaluate-insight actions were just implemented (commit `076b299`). The code and tests exist, but 15 invariant claims from the wiki spec are still "specified-only" because `.shoe-makers/claim-evidence.yaml` has no entries mapping them to source/test evidence.

Additionally, some **existing** entries reference the old prioritise prompt content that was moved to evaluate-insight. These need updating.

## What to build

Add entries to `.shoe-makers/claim-evidence.yaml` for these 15 invariant IDs. Follow the existing pattern: each entry has a `source:` section (patterns matched against code with comments stripped) and a `test:` section (patterns matched against test files).

### New entries needed

**Section 2.3 — Three-phase orchestration (2 items)**:

1. `spec.three-phase-orchestration-bottom-of-tree.innovate-fires-at-innovation-tier-tier-3-instead-of-explore-`
   - Source: look for `innovate` in `src/tree/default-tree.ts` and `isInnovationTier` in `src/prompts/helpers.ts`
   - Test: look for `innovate` in `src/__tests__/evaluate.test.ts` or `src/__tests__/default-tree.test.ts`

2. `spec.three-phase-orchestration-bottom-of-tree.evaluateinsight-fires-when-insight-files-exist-generous-eval`
   - Source: look for `evaluate-insight` in `src/tree/default-tree.ts` and `hasInsights` condition
   - Test: look for `evaluate-insight` in `src/__tests__/evaluate.test.ts` or `src/__tests__/default-tree.test.ts`

**Section 2.5 — Hierarchy of needs (3 items)**:

3. `spec.hierarchy-of-needs-in-prioritisation.tier-3-innovation-actively-improve-beyond-instructions-ux-fo`
   - Source: the innovate prompt or isInnovationTier function
   - Test: innovation tier tests

4. `spec.hierarchy-of-needs-in-prioritisation.no-impactful-work-remaining-is-never-acceptable-output-at-ti`
   - Source: the innovate prompt says "NOT acceptable" for no output
   - Test: innovate prompt tests

5. `spec.hierarchy-of-needs-in-prioritisation.at-tier-3-elves-should-ask-could-this-system-be-easier-for-h`
   - Source: this content was in the old explore innovation tier but was removed. The innovate prompt doesn't have this exact text. May need to check if the creative brief implicitly covers this, or note that it's about the wiki overview included in the innovate prompt.

**Section 2.6 — Creative exploration (10 items)**:

6. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.at-innovation-tier-all-invariants-met-health-good-the-tree-r`
   - Source: `isInnovationTier` in helpers.ts, `innovationTier` in default-tree.ts
   - Test: tree routing tests for innovate

7. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.the-setup-script-prepares-a-deterministic-creative-brief-rea`
   - Source: `readWikiOverview` and `fetchRandomArticle` in setup.ts
   - Test: (this is integration-level, may need to test via prompt content tests)

8. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.the-innovate-elf-must-write-an-insight-file-output-is-mandat`
   - Source: "MUST" and "NOT acceptable" in buildInnovatePrompt
   - Test: innovate prompt tests checking "MUST" and "NOT acceptable"

9. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.insights-go-to-shoemakersinsights-separate-from-findings-the`
   - Source: `.shoe-makers/insights/` in prompts
   - Test: insight path tests (already has source evidence, need to check if it's wired for this specific ID)

10. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.a-separate-evaluateinsight-action-fires-when-insight-files-e`
    - Source: `evaluate-insight` in tree, `generous disposition` in prompt
    - Test: evaluate-insight prompt tests

11. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.the-evaluator-builds-on-ideas-constructively-could-this-work`
    - Source: "engage constructively" in buildEvaluateInsightPrompt
    - Test: evaluate-insight prompt tests

12. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.the-evaluator-can-promote-viable-work-item-rework-rewrite-th`
    - Source: Promote, Rework, Dismiss in buildEvaluateInsightPrompt
    - Test: evaluate-insight prompt tests (already partially exists — check if ID matches)

13. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.good-evaluation-improves-ideas-not-just-filters-them-the-raw`
    - Source: "make them better" in buildEvaluateInsightPrompt
    - Test: evaluate-insight prompt tests

14. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.the-separation-between-generating-insights-divergent-and-eva`
    - Source: "divergent/creative mode" and "constructive/convergent mode" in three-phase.ts
    - Test: innovate and evaluate-insight prompt tests

15. `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.the-insight-evaluator-is-not-the-prioritise-elf-the-prioriti`
    - Source: "NOT the prioritise elf" in buildEvaluateInsightPrompt
    - Test: evaluate-insight prompt tests

### Existing entries to update

These existing entries in claim-evidence.yaml referenced old prioritise prompt content that was moved to evaluate-insight:

- `spec.creative-exploration.the-prioritise-elf-evaluates-insights-critically-not-just-tr` — change "engage with the idea critically" to "engage constructively" (now in evaluate-insight prompt)
- `spec.creative-exploration.the-separation-between-generating-insights-divergent-and-eva` — change "evaluative mode" to "convergent mode" (now says "constructive/convergent mode")

## Patterns to follow

Look at existing entries in `.shoe-makers/claim-evidence.yaml` for the YAML format:
```yaml
spec.some-page.some-claim-id:
  source:
    - [pattern1, pattern2]  # Multiple patterns = OR within the bracket
  test:
    - [test-pattern1, test-pattern2]
```

- Source patterns match against TypeScript files with comments stripped
- Multiple items in one `[]` are OR — any matching proves the claim
- Multiple `-` entries are AND — all must match

## What NOT to change

- Do NOT modify `.shoe-makers/invariants.md` (human-maintained)
- Do NOT modify source files in `src/` or tests
- Only modify `.shoe-makers/claim-evidence.yaml`

## Tests

After adding entries, run `bun test src/__tests__/invariants.test.ts` to verify the specified-only count drops. The target is 0 specified-only and 0 untested.

## Decision Rationale

Candidate #1 was chosen because it has the highest impact: reducing specified-only invariants from 15 to 0 with minimal risk. The code already exists — we're just wiring the evidence. The other candidates (health improvements) are low-impact and the scores are acceptable (88-91).
