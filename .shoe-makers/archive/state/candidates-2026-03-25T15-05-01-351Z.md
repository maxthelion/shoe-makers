# Candidates

## 1. Implement commit-or-revert verification gate
**Type**: implement
**Impact**: high
**Reasoning**: The two remaining specified-only invariants (`verification.commit-or-revert` and `spec.review-and-merge-with-confidence.verification-has-already-caught-and-reverted-bad-work`) both reference an automated commit-or-revert gate that doesn't exist. The current system uses cross-elf adversarial review (critique/fix-critique loop) but never automatically reverts bad commits. The finding in `.shoe-makers/findings/stale-verification-invariants.md` documents this gap. Implementation would add a post-commit verification step in the scheduler that runs tests and reverts the commit if they fail, ensuring "what's on the branch passed checks" is mechanically true rather than relying on the review cycle. Alternatively, the human may prefer to update the invariants to match the current adversarial review model — but implementing the gate as specified closes both remaining invariant gaps. Affects: `src/scheduler/`, `src/verify/`, `src/tree/default-tree.ts`. Spec: `wiki/pages/architecture.md`, `wiki/pages/verification.md`, invariants section 1.3 and 4.

## 2. Fix stale invariants: skills list and section numbering
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Finding `.shoe-makers/findings/stale-invariants-skills-list.md` documents three issues in `invariants.md`: (1) Section 3.2 lists octoclean-fix, bug-fix, dependency-update, dead-code as "Planned" but all 9 skills are now implemented. (2) Section 2.2 is missing the `uncommitted changes → review` and `dead-code work-item` reactive conditions that exist in the tree. (3) Duplicate section numbering — 1.6 and 3.4 each appear twice. This is flagged as requiring human action since elves cannot modify `invariants.md`, but the finding should be surfaced as a high-priority candidate for the human's attention. The stale skills list causes the invariant checker to report false gaps. **Note: this requires human action — elves cannot modify invariants.md.**

## 3. Improve code health of worst-scoring files
**Type**: health
**Impact**: medium
**Reasoning**: Setup reports three files below threshold: `src/__tests__/prompts.test.ts` (87), `src/__tests__/prompt-builders.test.ts` (90), `src/setup.ts` (92). The overall health is 99/100, but these files drag it down. `prompts.test.ts` has a large flat test structure with repeated `makeState()` calls and long inline test case arrays — extracting shared fixtures or using parameterized test patterns could improve readability and score. `prompt-builders.test.ts` likely has similar patterns. `setup.ts` at 92 is borderline but could benefit from extracting helper functions if it has high cyclomatic complexity. Improving these files would push health toward 100 and demonstrate the health skill working on real targets.

## 4. Add tests for commit-or-revert / verification gate behavior
**Type**: test-coverage
**Impact**: medium
**Reasoning**: Whether the commit-or-revert gate is implemented (candidate 1) or the invariants are updated to describe the adversarial review model, the verification pipeline in `src/verify/` should have explicit tests proving that bad work is caught. Currently `detect-violations.test.ts` and `violation-findings.test.ts` exist but there's no integration-level test showing the full flow: elf commits bad work → verification detects it → critique/revert happens. Adding such a test would close the "Verification has already caught and reverted bad work" invariant with evidence even under the current review model.

## 5. Sync README with current capabilities
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README is mostly accurate but has minor drift. The `enabled-skills` config example lists only 5 skills (`fix-tests, implement, test-coverage, doc-sync, health`) but all 9 are now implemented. The README should either list all 9 or note that omitting the field enables all skills (which it does mention but the example is misleading). Also, the innovation tier section is duplicated — paragraphs 4 and 6 under "How it works" both describe the Wikipedia creative lens. Minor polish but the explore action spec says to check README accuracy and flag drift.
