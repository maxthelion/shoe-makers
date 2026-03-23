# Candidates

## 1. Add src/utils/ to wiki architecture page
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The only remaining unspecified entry is `src/utils/` (shared utility functions, currently just `fileExists()`). Adding a brief mention to `wiki/pages/architecture.md` and/or adding a claim-evidence mapping in `.shoe-makers/claim-evidence.yaml` would resolve the last unspecified invariant. Trivially achievable.

## 2. Improve test file quality scores
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: Three test files tied at 94/100 as worst files: `evaluate.test.ts`, `invariants.test.ts`, `prompts.test.ts`. Could extract shared fixtures, parameterize repetitive tests, or split large test files. Marginal improvement (94→~96) but low risk.

## 3. Add claim-evidence entries for utils directory
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: Rather than adding wiki text about utils, could add evidence patterns in `.shoe-makers/claim-evidence.yaml` that map existing wiki claims to the utils directory. This is an alternative to wiki edits — depends on whether the invariant system would match it. Lower confidence than option 1 since the claim-evidence approach may not cover "unspecified" detection.
