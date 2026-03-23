# Candidates

## 1. Doc-sync: document src/utils/ and init-skill-template split in wiki
**Type**: doc-sync
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: The assessment reports 4 unspecified directories/files. The `src/utils/` directory and the three new `init-skill-templates-*.ts` files have no wiki coverage. Adding brief mentions in `wiki/pages/architecture.md` (project structure section) would resolve all unspecified invariants, bringing the count from 4 to 0. This directly improves the invariants dashboard. Affects `wiki/pages/architecture.md`.

## 2. Improve evaluate.test.ts quality score
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: `src/__tests__/evaluate.test.ts` scores 94/100, tied for worst file. At 324 lines with repetitive `makeState()` patterns, it could benefit from test parameterization. However the improvement would be marginal and the tests are well-written. Lower priority than doc-sync.

## 3. Push branch to remote
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The branch is currently 13+ commits ahead of origin. Pushing would back up the work and make it available for human review. Not strictly a code improvement but ensures work isn't lost.
