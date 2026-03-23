# Candidates

## 1. Reduce prompts.test.ts complexity (score 88 — worst file)
**Type**: health
**Impact**: high
**Skill**: octoclean-fix
**Reasoning**: `src/__tests__/prompts.test.ts` scores 88/100, the worst file in the codebase. At 459 lines with many repetitive `expect(prompt).toContain(...)` patterns across 40+ tests, it drives the health score down. Extracting a helper like `expectPromptContains(action, state, ...strings)` and grouping related assertions would reduce line count and duplication without changing test coverage. This is the highest-leverage health improvement available.

## 2. Exploration cache — detect stuck candidates across cycles
**Type**: improve
**Impact**: medium
**Skill**: implement
**Reasoning**: When explore produces a candidate that the prioritiser doesn't pick, the same candidate resurfaces next cycle indefinitely. Adding a lightweight candidate-history tracker (JSON file with hashed titles + timestamps) would let explore flag repeats and either drop them or escalate to a finding. Prevents infinite loops on non-actionable items.

## 3. Add `unspecified` invariant tracking to claim-evidence
**Type**: test
**Impact**: medium
**Skill**: test-coverage
**Reasoning**: The setup reports `0 unspecified` invariants — features with code and tests but no wiki spec. Currently there's no claim-evidence entry tracking that the system *detects* unspecified invariants and reports them. Adding evidence entries for the unspecified detection logic in `src/verify/invariants.ts` would strengthen the verification gate's own verification. Files: `.shoe-makers/claim-evidence.yaml`, `src/verify/invariants.ts`.
