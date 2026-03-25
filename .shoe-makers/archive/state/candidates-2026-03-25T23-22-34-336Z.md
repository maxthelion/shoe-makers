# Candidates

## 1. README: document partial work and continue-work flow
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README tree diagram shows the partial work node but doesn't explain what it means or how agents use it. Partial work is a resilience feature specified in `wiki/pages/pure-function-agents.md` and implemented across `src/state/world.ts`, `src/tree/default-tree.ts`, `src/prompts/reactive.ts`. A brief paragraph under "How it works" would help new users understand this capability.

## 2. Improve health score of worst-scoring test files
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: Health is 99/100 with `src/__tests__/config.test.ts` (96), `src/__tests__/detect-violations.test.ts` (96), and `src/__tests__/evaluate.test.ts` (96) as worst files. Extracting test helpers or reducing boilerplate in config.test.ts (which grew from the new threshold tests) could restore health to 100/100.

## 3. Wiki doc-sync: document new config keys in architecture.md
**Type**: doc-sync
**Impact**: low
**Reasoning**: `wiki/pages/architecture.md` mentions `config.yaml — overridable settings` but doesn't list individual keys. While `wiki/pages/integration.md` has the full table (now updated), the architecture page could reference it or include a brief note about the configurable thresholds for completeness.
