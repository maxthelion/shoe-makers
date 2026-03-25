# Candidates

## 1. Improve health of remaining worst-scoring test files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: After the previous octoclean-fix cycle, the worst files are now `src/__tests__/prompt-builders.test.ts` (92), `src/__tests__/prompts-features.test.ts` (93), and `src/__tests__/world.test.ts` (93). The prompt-builders file still has inline assessment construction in some places that could use the shared `makeStateWithAssessment`/`makeAssessment` helpers. The `world.test.ts` file likely has similar patterns. Further consolidation could push the health score to 100.

## 2. Add tests for untested modules (blackboard, permission-setup)
**Type**: test
**Impact**: medium
**Reasoning**: `src/state/blackboard.ts` handles JSON serialization of assessment state between ticks — runtime-critical but untested. `src/scheduler/permission-setup.ts` detects previous elf's permission violations and feeds into the verification gate — also untested. Both are small modules (69 and ~80 lines) so test coverage would be quick. Wiki page `verification.md` specifies role-based permissions; testing permission-setup verifies the spec.

## 3. Replace empty catch blocks in world.ts with meaningful fallbacks
**Type**: health
**Impact**: low
**Reasoning**: `src/state/world.ts` contains 5+ empty catch blocks that silently swallow errors when counting inbox files, findings, and insights. While graceful degradation to 0/false is correct, the complete absence of logging makes debugging difficult. The `observability.md` wiki page specifies full observability. Adding `console.debug()` in each catch block would improve debuggability without changing behavior.

## 4. Sync README with current state (octoclean optional, wiki server path)
**Type**: doc-sync
**Impact**: low
**Reasoning**: The `bun run wiki` command references a hardcoded local path `/Users/maxwilliams/dev/octowiki/src/index.ts` in package.json — not portable. README mentions octoclean monitoring without noting it's optional. Minor onboarding friction per `wiki-as-spec.md`.
