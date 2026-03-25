# Candidates

## 1. Add process-loop circuit breaker to the behaviour tree
**Type**: implement
**Impact**: high
**Reasoning**: The `src/log/shift-log-parser.ts` already tracks `reviewLoopCount` (critique/fix-critique alternation ≥3x) and `reactiveRatio`. But nothing in the tree uses these to prevent infinite loops. If a critique produces a blocking finding the fix-critique elf can't resolve, the system would loop forever. Adding a tree condition that checks `processPatterns.reviewLoopCount > 3` and routes to explore would provide a circuit breaker. The process patterns are already in the assessment (via `getShiftProcessPatterns`), but they're not currently fed to the WorldState for tree evaluation. Changes needed: `src/types.ts` (add processPatterns to WorldState), `src/setup.ts` (pass processPatterns through), `src/tree/default-tree.ts` (add circuit-breaker condition between unresolved-critiques and unreviewed-commits).

## 2. Make typecheck work without npm registry access
**Type**: health
**Impact**: medium
**Reasoning**: The `tsconfig.json` specifies `"types": ["bun-types"]` which requires `@types/bun` from npm. When npm is unavailable, `runTypecheck()` returns `null` — the system has no type safety signal. Removing `"types": ["bun-types"]` from tsconfig would let bun's native type resolution work. Alternatively, the typecheck command could be changed to use bun's built-in checker. This would make `typecheckPass` actually meaningful.

## 3. Verify and update README.md
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The README should accurately reflect current capabilities: 221 tested invariants, skill registry with 9 skill types, creative exploration with Wikipedia + local fallback, process pattern detection, shift summaries, working hours enforcement, and the orchestration skip for review churn reduction.

## 4. Add invariant evidence for new orchestration skip feature
**Type**: test
**Impact**: low
**Reasoning**: The new `ORCHESTRATION_PREFIXES` expansion in `detect-violations.ts` adds behaviour not covered by existing claim evidence. The invariants pipeline may not have evidence patterns for this new filtering. Adding claim evidence would ensure the feature is tracked as an implemented-tested invariant.
