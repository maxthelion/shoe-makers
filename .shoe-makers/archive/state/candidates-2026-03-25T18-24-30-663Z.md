# Candidates

## 1. Further octoclean-fix for prompt-builders.test.ts (score 92)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompt-builders.test.ts` is the worst-scoring file at 92. It still has some inline assessment construction that could use the shared `makeStateWithAssessment`/`makeAssessment` from test-utils. The file is 350+ lines; further consolidation of the `describe("buildExplorePrompt")` section could reduce length and improve readability. Target: bring score from 92 to 95+.

## 2. Add meaningful error context to empty catch blocks in world.ts
**Type**: health
**Impact**: low
**Reasoning**: `src/state/world.ts` has 5 empty catch blocks (lines 38, 51, 67, 75, 94, 117) that silently return 0/false/null. While the fallback values are correct, zero diagnostic information is preserved when errors occur. Wiki `observability.md` spec says the system should have full observability. Adding `console.debug` calls would make debugging possible without changing behavior.

## 3. Reduce duplication in world.test.ts (score 93)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/world.test.ts` is at score 93 and is 350 lines. As the third-worst file, reducing its size through shared test helpers could contribute to pushing the overall health score. It likely has temp-dir patterns that could use `withTempDir` from test-utils.

## 4. Check dependency freshness
**Type**: dependency-update
**Impact**: low
**Reasoning**: package.json has `typescript@5.9.3` and `@types/bun@1.3.11`. Running `bun outdated` would reveal if any dependencies have security patches or breaking changes. Low risk since the project has good test coverage.
