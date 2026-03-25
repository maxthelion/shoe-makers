# Candidates

## 1. Add validation patterns to remaining skill files
**Type**: implement
**Impact**: medium
**Reasoning**: Only 3 of 9 skill files (fix-tests, implement, test-coverage) have `## Validation` sections. The spec (`wiki/pages/structured-skills.md`) says all skills should have validation patterns. Remaining skills without patterns: bug-fix, dead-code, dependency-update, doc-sync, health, octoclean-fix. Adding patterns to these completes the validation infrastructure that was just wired into the critique prompt.

Files: `.shoe-makers/skills/bug-fix.md`, `.shoe-makers/skills/dead-code.md`, `.shoe-makers/skills/dependency-update.md`, `.shoe-makers/skills/doc-sync.md`, `.shoe-makers/skills/health.md`, `.shoe-makers/skills/octoclean-fix.md`

## 2. Surface process patterns in explore prompt
**Type**: implement
**Impact**: medium
**Reasoning**: `computeProcessPatterns()` in `src/log/shift-log-parser.ts` calculates reactive ratio, review loop count, and innovation cycle count. The assessment stores these in `processPatterns`. The explore prompt (`src/prompts/explore.ts`) already has process temperature guidance for reactive ratio but doesn't surface the raw review loop count or innovation cycle count. Adding these would give the explorer more context about shift dynamics.

Files: `src/prompts/explore.ts`, `src/types.ts`

## 3. Consolidate world.test.ts temp dir setup (score 91)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/world.test.ts` (399 lines, score 91) has repeated temp directory setup/teardown across multiple describe blocks. Extracting a `withTempRepo` helper to `test-utils.ts` would reduce boilerplate.

Files: `src/__tests__/world.test.ts`, `src/__tests__/test-utils.ts`

## 4. Add validation patterns to claim-evidence for structured-skills invariants
**Type**: implement
**Impact**: medium
**Reasoning**: The structured-skills spec (`wiki/pages/structured-skills.md`) describes validation pattern enforcement, but there are no claim-evidence entries for it. Adding evidence patterns that check for `parseValidationPatterns`, `validationPatterns`, and `## Validation` in skill files would let the invariant checker verify this feature exists and is wired up.

Files: `.shoe-makers/claim-evidence.yaml`
