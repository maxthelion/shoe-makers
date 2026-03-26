# Candidates

## 1. Fix README innovation tier duplication
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `README.md` lines 33 and 37 describe the innovation tier twice with overlapping content. Line 33: "At innovation tier (all invariants met, health good), the tree routes to Innovate instead of Explore..." and line 37: "When all invariants are met and code health is good, the system enters the innovation tier..." — nearly identical. Per `wiki/pages/wiki-as-spec.md`, documentation should be clear and non-redundant. Removing the duplicate paragraph improves readability. Quick fix with clear value.

## 2. Add tests for findValidationPatterns helper
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/prompts/helpers.ts:findValidationPatterns` was extracted in the previous refactoring cycle but has no dedicated tests. It has 4 code branches: null previousAction, unrecognized action type, no matching skill type, and successful pattern lookup. Adding tests would verify the integration between action types, skill types, and validation patterns. This is a small gap from the refactoring.

## 3. Split prompt-builders.test.ts (octoclean score 90)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/prompt-builders.test.ts` (score 90, 413 lines) tests all 12 prompt builder functions in one file. It could be split into reactive builders (buildFixTestsPrompt, buildFixCritiquePrompt, buildCritiquePrompt, buildContinueWorkPrompt, buildReviewPrompt, buildInboxPrompt) and three-phase builders (buildExplorePrompt, buildPrioritisePrompt, buildExecutePrompt, buildDeadCodePrompt, buildInnovatePrompt, buildEvaluateInsightPrompt). However, at score 90 the health impact is marginal — diminishing returns compared to the prompts.test.ts split (score 87→90).
