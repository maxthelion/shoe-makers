# Candidates

## 1. Reduce prompt-builders.test.ts size (score 90)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-builders.test.ts` (now 2nd worst at 90) can be consolidated. The critique prompt tests generate the same prompt multiple times independently. Generating once per describe block and asserting against the result would reduce duplication.

Files: `src/__tests__/prompt-builders.test.ts`

## 2. Update structured-skills wiki page to reflect validation implementation
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/structured-skills.md` describes the validation pattern system as a design goal. Now that it's implemented (all 9 skills have `## Validation` sections, patterns are surfaced in the critique prompt), the wiki should reflect this as current reality rather than future intent.

Files: `wiki/pages/structured-skills.md`

## 3. Reduce prompts.test.ts to improve worst file score (87)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` remains the worst file at 87. Further consolidation possible: the `explore prompt creative lens` and `insight lifecycle in prompts` blocks have overlapping tests about creative lens inclusion in explore prompts.

Files: `src/__tests__/prompts.test.ts`
