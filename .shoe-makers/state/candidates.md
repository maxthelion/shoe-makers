# Candidates

## 1. Implement creative corpus support for local Wikipedia articles
**Type**: implement
**Impact**: high
**Reasoning**: Six specified-only invariants relate to the creative corpus system (`spec.creative-exploration-dedicated-innovate-and-evaluate-insight-actions.*`). The spec says random concepts come from `.shoe-makers/creative-corpus/` — markdown files with title, source URL, and summary. Setup should pick one unused article at random and embed it in the innovate prompt. After use, the article's frontmatter gets `used: true`. Currently `src/creative/wikipedia.ts` fetches from Wikipedia directly, but the spec requires a local corpus approach (Wikipedia is blocked in cloud). This is the largest cluster of unimplemented invariants (6 claims) and is foundational to the tier-3 innovation pipeline. Affected invariants: corpus source, corpus population script, setup picks unused article, marks used after tick, handles empty corpus, concise articles.

## 2. Implement structured skill templates with validation patterns
**Type**: implement
**Impact**: high
**Reasoning**: Ten specified-only invariants relate to structured skills (`spec.skills.*`). The spec in `wiki/pages/structured-skills.md` says every elf task has a mechanical part and an intelligent part. Skills should handle the mechanical part completely — setup gathers context and interpolates it into skill templates, each template defines exact output format and validation patterns, and the adversarial reviewer checks format compliance. Currently skills are plain markdown prompts in `.shoe-makers/skills/`. Needs: validation patterns in skill definitions, context interpolation in setup, format checking in review. Largest group of unmet invariants (10 claims).

## 3. Implement verification commit-or-revert gate
**Type**: implement
**Impact**: high
**Reasoning**: The `verification.commit-or-revert` invariant from `wiki/pages/verification.md` specifies that verification should either commit (approve) or revert bad work. Currently `src/verify/` has detection and permissions but no commit-or-revert gate. The `spec.review-and-merge-with-confidence.verification-has-already-caught-and-reverted-bad-work` invariant also depends on this. Two specified-only invariants. This is architectural — it's how the system ensures only verified work stays on the branch.

## 4. Reduce prompts.test.ts duplication (octoclean score 87)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` is the worst-scoring file at 87/100. It has 4 near-identical factory functions that each spread `freshAssessment` with minor overrides. A parameterized helper would eliminate ~60 lines of duplication. Also has duplicated skill definitions. This is the single biggest drag on the 99/100 health score.

## 5. Surface stale invariants for human update
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The finding `.shoe-makers/findings/stale-invariants-skills-list.md` notes that invariants.md section 3.2 lists only 5 skills as current when all 9 are implemented, section 2.2 is missing reactive conditions, and there are duplicate section numbers. The `verification.commit-or-revert` claim-evidence entry looks for patterns that may no longer exist. Wiki pages should be synced to accurately describe current capabilities, and a finding should re-surface the invariants staleness for human action.
