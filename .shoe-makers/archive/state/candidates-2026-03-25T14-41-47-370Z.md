# Candidates

## 1. Consolidate world.test.ts temp dir setup (score 91)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/world.test.ts` (399 lines, score 91) has repeated temp directory setup/teardown across multiple describe blocks. Each creates a temp git repo with `mkdtemp` + `git init` + `git commit --allow-empty`. Extracting a `withTempRepo` helper would reduce ~100 lines of boilerplate and improve the health score.

Files: `src/__tests__/world.test.ts`, `src/__tests__/test-utils.ts`

## 2. Add claim-evidence entries for structured-skills validation
**Type**: implement
**Impact**: medium
**Reasoning**: The structured-skills spec and now the code have validation patterns parsed and surfaced in critique prompts. But `.shoe-makers/claim-evidence.yaml` has no entries to verify this. Adding evidence patterns that look for `validationPatterns`, `parseValidationPatterns`, and `Validation patterns to check` would let the invariant checker confirm the feature exists.

Files: `.shoe-makers/claim-evidence.yaml`

## 3. Update structured-skills wiki page to reflect implementation
**Type**: doc-sync
**Impact**: low
**Reasoning**: `wiki/pages/structured-skills.md` describes the validation pattern system but may not reflect the current implementation details (e.g., that patterns are surfaced in the critique prompt, that all 9 skills have validation sections). Updating the spec to match the code closes the doc-code gap.

Files: `wiki/pages/structured-skills.md`
