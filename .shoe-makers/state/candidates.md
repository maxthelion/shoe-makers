# Candidates

## 1. Add claim-evidence entries for innovate and evaluate-insight invariants
**Type**: implement
**Impact**: high
**Reasoning**: 15 invariants are specified-only — all relating to the innovate/evaluate-insight features (invariants section 2.3 and 2.6). These features were just implemented in `076b299` but no evidence entries were added to `.shoe-makers/claim-evidence.yaml`. The code and tests exist to satisfy these claims — we just need to map the evidence. This is the single highest-impact item because it would reduce specified-only from 15 to 0.

Key invariant IDs to wire:
- `spec.three-phase-orchestration-bottom-of-tree.innovate-fires-at-innovation-tier-*`
- `spec.three-phase-orchestration-bottom-of-tree.evaluateinsight-fires-when-insight-files-*`
- `spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.*` (10 items)
- `spec.hierarchy-of-needs-in-prioritisation.*` (3 items about tier 3)

Evidence sources: `src/tree/default-tree.ts`, `src/prompts/three-phase.ts`, `src/prompts/helpers.ts`, `src/setup.ts`
Evidence tests: `src/__tests__/default-tree.test.ts`, `src/__tests__/evaluate.test.ts`, `src/__tests__/prompts.test.ts`

## 2. Add test for the untested `tdd-enforcement` invariant
**Type**: test
**Impact**: medium
**Reasoning**: There is 1 implemented-untested invariant: `verification.tdd-enforcement`. The architecture group has this claim but its test evidence hasn't been wired. Adding the test evidence entry to `claim-evidence.yaml` (tests exist in `src/__tests__/tdd-enforcement.test.ts`) would clear this.

## 3. Improve health score of `src/__tests__/prompts.test.ts` (score: 88)
**Type**: health
**Impact**: low
**Reasoning**: This is the worst file by octoclean score (88/100). The file grew with the new innovate/evaluate-insight prompt tests. Could benefit from extracting test helpers or grouping tests more effectively. However, the score is not critically bad.

## 4. Improve health score of `src/setup.ts` (score: 91)
**Type**: health
**Impact**: low
**Reasoning**: Second-worst file. Has grown to ~370 lines with `readWikiOverview` and `formatAction`. Could extract wiki overview reading into its own module. But 91 is acceptable.
