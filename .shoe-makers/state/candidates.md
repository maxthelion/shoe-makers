# Candidates

## 1. Refactor init-skill-templates.ts to reduce file size
**Type**: health
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/init-skill-templates.ts` remains the worst-scoring file in the codebase at 92/100. It's a 378-line monolithic file containing 9 exported template string constants. The file was already split from `init-templates.ts` but is still too large. Splitting into 2-3 smaller files (e.g. by risk level or category: work templates, quality templates, maintenance templates) would improve the health score. Wiki `functionality.md` specifies health improvements as a valid work category. Affects `src/init-skill-templates.ts` and `src/init.ts` (imports).

## 2. Add src/utils/ to wiki architecture page
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The setup assessment reports 1 unspecified directory: `src/utils/`. This was created to hold shared utilities (`fs.ts` with `fileExists()`). CLAUDE.md already lists it, but `wiki/pages/architecture.md` doesn't mention it in the project structure. Adding a one-line entry would resolve the unspecified invariant, bringing all categories to 0. Trivially achievable. Affects `wiki/pages/architecture.md`.

## 3. Improve evaluate.test.ts quality score
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: `src/__tests__/evaluate.test.ts` scores 94/100, the second-worst file. At 324 lines with many similar `makeState()` call patterns, it could benefit from extracting a shared test fixture factory or parameterizing similar priority-ordering tests. However the improvement would be marginal (94→~96) and the tests are well-written. Lower priority than the other candidates.
