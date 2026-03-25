# Candidates

## 1. Make typecheck work without npm registry access
**Type**: health
**Impact**: medium
**Reasoning**: The `tsconfig.json` specifies `"types": ["bun-types"]` which requires `@types/bun` from npm. When npm is unavailable, `runTypecheck()` in `src/skills/assess.ts` returns `null`. Removing `"types": ["bun-types"]` from tsconfig and relying on bun's native type resolution would make typecheck work everywhere. The `typecheckPass` assessment field would then actually catch real type errors instead of always being `null` in restricted environments. Files: `tsconfig.json`, `src/skills/assess.ts` (may need to change the typecheck command).

## 2. Update README.md to reflect current capabilities
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The README should document the current feature set: 221+ tested invariants, 9 skill types, creative exploration with Wikipedia + local fallback corpus, process pattern detection, review-loop circuit breaker, orchestration skip for review churn reduction, shift summaries, working hours enforcement. This helps the morning reviewer understand what the system does and what changed this shift.

## 3. Push branch to remote for morning review
**Type**: health
**Impact**: medium
**Reasoning**: The shoemakers branch has accumulated significant work this shift (orchestration skip, creative fallback, circuit breaker, test fixes) but hasn't been pushed to remote. The morning reviewer needs to see the branch. This is standard end-of-shift hygiene per `wiki/pages/branching-strategy.md`.
