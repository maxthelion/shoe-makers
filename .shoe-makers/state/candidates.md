# Candidates

## 1. Add claim-evidence for morning review dashboard
**Type**: test
**Impact**: high
**Skill**: test-coverage
**Reasoning**: We just added `formatDashboard` and `prependShiftDashboard` to `src/log/shift-log.ts` with 7 tests, but there's no claim-evidence YAML entry linking the dashboard feature to the observability spec. The invariant checker (`src/verify/invariants.ts`) won't know this feature exists unless we add evidence entries. Without evidence, the next explore elf might propose reimplementing what already exists. Files: `.shoe-makers/claim-evidence.yaml`, `src/__tests__/shift-log.test.ts`.

## 2. Reduce prompts.test.ts complexity (score 88)
**Type**: health
**Impact**: medium
**Skill**: octoclean-fix
**Reasoning**: `src/__tests__/prompts.test.ts` is the worst-scoring file (88/100). At 459 lines with many repetitive `expect(prompt).toContain(...)` patterns, the test file could benefit from extracting a shared assertion helper (e.g. `expectPromptContains(action, state, ...strings)`) to reduce duplication. This would improve readability and the health score. Files: `src/__tests__/prompts.test.ts`.

## 3. Exploration cache — detect stuck candidates across cycles
**Type**: improve
**Impact**: medium
**Skill**: implement
**Reasoning**: When explore produces a candidate that the prioritiser doesn't pick, the same candidate resurfaces next cycle. There's no mechanism to detect or break this loop. Adding a lightweight fingerprint (hash of candidate titles) to `.shoe-makers/state/candidate-history.json` and flagging repeats in the explore prompt would add a useful feedback signal. Files: `src/skills/assess.ts`, `src/prompts.ts`, `src/state/blackboard.ts`.
