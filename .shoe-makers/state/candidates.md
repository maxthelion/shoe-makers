# Candidates

## 1. Add `expectPromptContains` helper to claim-evidence for test-utils patterns
**Type**: test
**Impact**: medium
**Skill**: test-coverage
**Reasoning**: The new `expectPromptContains` helper in `prompts.test.ts` reduced duplication significantly (459→393 lines, score 88→91). Similar helpers could be introduced in other test files (e.g. `invariants.test.ts` at 94, `shift-log.test.ts` at 95) to further improve health. Also, the helper pattern itself should be tracked as evidence for the spec's "testing conventions" claims.

## 2. Push branch to remote for human review
**Type**: improve
**Impact**: high
**Skill**: implement
**Reasoning**: This session has produced significant improvements: morning review dashboard (7 new tests), tightened claim-evidence patterns, grammar fix, test refactoring (prompts.test.ts 88→91). Pushing to remote makes the branch available for the human morning review. Without a push, all work stays local and can't be reviewed or merged.

## 3. Exploration cache — detect stuck candidates across cycles
**Type**: improve
**Impact**: medium
**Skill**: implement
**Reasoning**: When explore produces a candidate that the prioritiser doesn't pick, the same candidate resurfaces next cycle indefinitely. Adding a lightweight candidate-history tracker would let explore flag repeats and either drop them or escalate to a finding. This has been proposed in 2 consecutive explore cycles, suggesting it's valuable but keeps getting deprioritised against more immediate wins.
