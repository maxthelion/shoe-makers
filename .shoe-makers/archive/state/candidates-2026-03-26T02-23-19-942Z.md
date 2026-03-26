# Candidates

## 1. [Implement commit-or-revert verification step — revert bad work on test/typecheck failure]
**Type**: implement
**Impact**: high
**Reasoning**: The top invariant gap `verification.commit-or-revert` requires source code containing "commit" and "revert" string literals with matching tests. The wiki spec in `wiki/pages/verification.md` implies that bad work should be caught and reverted. Currently there is no mechanism that reverts commits when tests or typecheck fail. The setup already checks tests/typecheck — if they fail, the tree routes to `fix-tests`. But per invariant 1.3 ("Verification has already caught and reverted bad work — what's on the branch passed checks"), there should be an explicit commit-or-revert mechanism in the scheduler that reverts bad commits before the next elf starts. This closes two top invariant gaps simultaneously.

## 2. [Improve prompts.test.ts health score — extract innovate/evaluate-insight tests to dedicated files]
**Type**: health
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` has the worst health score (87/100, 560 lines). Some of its tests overlap with the newer dedicated test files (`explore-prompt.test.ts`, `prioritise-prompt.test.ts`, `innovate-prompt.test.ts`). The innovate and evaluate-insight prompt tests in `prompts.test.ts` could be extracted to the dedicated files or removed as redundant, reducing file complexity.

## 3. [Add creative corpus evidence patterns — close multiple specified-only invariant gaps]
**Type**: implement
**Impact**: medium
**Reasoning**: 6 of the 21 specified-only invariant gaps relate to creative corpus behaviour (corpus from `.shoe-makers/creative-corpus/`, `scripts/fetch-wikipedia-corpus.sh`, setup picks unused article, marks as used, etc.). The implementation exists in `src/creative/wikipedia.ts` with tests in `src/__tests__/creative-corpus.test.ts`. The evidence patterns in claim-evidence files may need updating to match the actual code, or additional tests may be needed to satisfy the evidence matcher.
