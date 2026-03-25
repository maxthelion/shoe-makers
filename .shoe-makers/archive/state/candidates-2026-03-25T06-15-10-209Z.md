# Candidates

## 1. Bug: permissions.ts hardcodes "wiki/" instead of using configurable wikiDir
**Type**: bug-fix
**Impact**: high
**Reasoning**: `src/verify/permissions.ts` hardcodes `"wiki/"` in every role's canWrite/cannotWrite lists (lines 30, 35, 40, 45, 49, 54, 60, 65, 70, 75, 80). The system supports a configurable `wiki-dir` via `config.yaml` (see `src/config/load-config.ts:99`), and `assess.ts`, `extract-claims.ts`, and `invariants.ts` all pass `wikiDir` through. But if a user configures `wiki-dir: docs/wiki`, permission checks would still enforce against `"wiki/"` — meaning an executor writing to `docs/wiki/` would not be allowed (no canWrite match), and a reviewer writing to `docs/wiki/` would not be blocked (no cannotWrite match). `getPermissions()` needs to accept the config's wikiDir. Similarly, `src/setup.ts:389` (`readWikiOverview`) hardcodes `join(repoRoot, "wiki", "pages", file)` instead of using the loaded config's wikiDir.

## 2. Add direct unit tests for prompts/helpers.ts edge cases
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/helpers.ts` controls tier classification (hygiene/implementation/innovation), formats assessment summaries, and maps skill types. While 109 integration tests exist in `prompts.test.ts`, the helper functions themselves aren't directly unit-tested for edge cases like: null health scores with non-null invariant counts, boundary conditions in `isInnovationTier()` (e.g., exactly 0 specified-only + 0 untested but health < 100), or `parseActionTypeFromPrompt()` with malformed inputs. The tier logic gates whether the tree routes to `innovate` vs `explore` — a bug silently changes system behaviour. Invariants 2.3 (three-phase orchestration) depend on correct tier classification.

## 3. Add direct unit tests for prompts/reactive.ts and prompts/three-phase.ts
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/prompts/reactive.ts` (~150 LOC) and `src/prompts/three-phase.ts` (249 LOC) generate the actual prompts that elves receive. They contain conditional logic — permission violations section injection, Wikipedia lens injection, wiki summary inclusion for innovate — that isn't directly unit-tested. Integration tests in `prompts.test.ts` provide some coverage but don't isolate specific builders. A formatting bug could give an elf broken or incomplete instructions. Lower priority than helpers.ts since integration coverage exists.

## 4. Stale invariants finding needs human attention (informational)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The existing finding `invariant-update-2026-03-25.md` documents two specified-only invariants ("commit or revert" and "Verification has already caught and reverted bad work") referencing the removed verify model. These can only be updated by humans per the permission model. This candidate is informational — it surfaces the gap. The 2 specified-only invariants in the assessment are entirely due to this stale spec. No elf action possible.

## 5. readWikiOverview in setup.ts ignores config.wikiDir
**Type**: bug-fix
**Impact**: low
**Reasoning**: `src/setup.ts:389` uses `join(repoRoot, "wiki", "pages", file)` instead of reading from the loaded config's `wikiDir`. The config is already loaded at line 75 (`const config = await loadConfig(repoRoot)`), so the fix is straightforward: pass `config.wikiDir` to `readWikiOverview`. This is related to candidate #1 but is a separate code path. Impact is low because the function only affects the innovate creative brief, and most deployments use the default `wiki` directory.
