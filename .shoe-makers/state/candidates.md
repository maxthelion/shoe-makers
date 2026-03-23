# Candidates

## 1. Complete test helper consolidation (freshAssessment duplication)
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: Critique-051 identified that `prompts.test.ts:8` and `shift.test.ts:13` still define local `freshAssessment` constants identical to the shared one in `test-utils.ts`. The previous elf extracted `emptyBlackboard`, `freshAssessment`, and `makeState` to `test-utils.ts` but only updated 2 of 4 consuming files. This is a straightforward follow-up to commit b95cc8e. Eliminates ~30 lines of duplication.

## 2. Archive resolved 2026-03-23 findings
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: There are 55+ findings files in `.shoe-makers/findings/` from 2026-03-23, all resolved. The previous shift archived 125 findings from 2026-03-21 and 2026-03-22 (commit cdaf891). The same should be done for today's resolved critiques and findings to keep the directory clean and reduce context noise for future explore phases.

## 3. Resolve stale `exclusion-list-stale-2026-03-23.md` finding by verifying accuracy
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: `.shoe-makers/findings/exclusion-list-stale-2026-03-23.md` is marked Resolved but should be verified. This finding was about the EXCLUDED_TOP_LEVEL set in `invariants.ts` containing stale entries after the init-skill-templates split. If the fix was already applied, no action needed. If not, a one-line fix removes dead data.
