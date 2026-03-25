# Candidates

## 1. Split prompts into individual files per action (structural modularity)
**Type**: health
**Impact**: high
**Reasoning**: Inbox message `.shoe-makers/inbox/structural-modularity.md` requests splitting `src/prompts/three-phase.ts` (267 lines, all proactive prompts in one file) into individual files per action: `src/prompts/explore.ts`, `src/prompts/innovate.ts`, etc. Also split matching tests. This reduces merge conflicts when parallel branches modify different actions and aligns with the structured skills architecture. The index file re-exports. Same for `src/__tests__/prompts.test.ts` (738 lines, worst health score at 87).

## 2. Surface stale verification invariants for human action
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The last 2 specified-only invariants (`verification.commit-or-revert` and "Verification has already caught and reverted bad work") reference a commit-or-revert model. The existing finding `.shoe-makers/findings/stale-invariants-skills-list.md` also flags stale sections. These need human review — elves cannot modify invariants.md. A doc-sync could update wiki pages to accurately describe the current verification model (cross-elf adversarial review, not commit-or-revert).

## 3. Add validation patterns to existing skill files
**Type**: implement
**Impact**: medium
**Reasoning**: The structured skills infrastructure (`validationPatterns`, `interpolateSkillContext`) is now implemented but no skill files have `## Validation` sections yet. Adding regex validation patterns to skill files like `write-critique`, `write-candidates`, and `write-work-item` would close the loop and make format compliance enforcement real, not just plumbing.

## 4. Improve prompts.test.ts health score (currently 87)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: The test file is still the worst-scoring at 87/100 despite the factory consolidation. Further improvements: extract prompt test helpers to a shared module, reduce the large `promptCases` table to use more descriptive groupings, split by test concern into smaller files.
