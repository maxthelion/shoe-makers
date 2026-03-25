# Candidates

## 1. Add tests for Wikipedia creative module
**Type**: test
**Impact**: high
**Skill**: test-coverage
**Reasoning**: `src/creative/wikipedia.ts` exports `fetchRandomArticle()` and `shouldIncludeLens()` — neither has tests. These drive the creative pipeline (innovate + explore). `shouldIncludeLens()` is pure and trivial to test. `fetchRandomArticle()` needs fetch mocking. This was flagged in critique-2026-03-23-001 and is still unaddressed. Ref: invariants section 2.6 (creative exploration), `src/__tests__/wikipedia.test.ts` exists but only tests the article format, not the core functions.

## 2. Add tests for config loading
**Type**: test
**Impact**: medium
**Skill**: test-coverage
**Reasoning**: `src/config/load-config.ts` parses `config.yaml` and applies defaults. Config errors can silently change tree behaviour (e.g., wrong `tickInterval` or `maxInnovationCycles`). No test file exists for this module despite it being critical to scheduler operation. Ref: wiki `architecture.md` (config loading), `src/__tests__/config.test.ts` exists but only tests the YAML parsing, not `loadConfig()` integration with file system.

## 3. Reduce setup.ts complexity by extracting Wikipedia/article fetching
**Type**: health
**Impact**: medium
**Skill**: health
**Reasoning**: `src/setup.ts` is 409 lines handling 8+ concerns: branch management, assessment, tree evaluation, Wikipedia fetching, permission checks, prompt generation, state writing, and shift logging. The Wikipedia article fetching + shift log integration (lines 86-100) is a self-contained block that could be extracted to a helper. This would make setup.ts more readable and the article-fetching logic independently testable. Ref: wiki `architecture.md` (pure function agents principle — setup should be thin orchestration).

## 4. Implement plan-based candidate generation
**Type**: implement
**Impact**: medium
**Skill**: implement
**Reasoning**: Wiki `plans-vs-spec.md` specifies that plan pages (`category: plan`, `status: open`) should generate work. `assess.ts` already reads open plans (`findOpenPlans`), and the assessment includes `openPlans` count. But the behaviour tree has no condition for "open plans exist" — the explore prompt doesn't mention plans as a source of candidates. Currently plans are read but never acted on. Ref: wiki `plans-vs-spec.md`, `src/tree/default-tree.ts`, invariants section 1.4.

## 5. Add missing evidence patterns for implemented invariants
**Type**: doc-sync
**Impact**: low
**Skill**: doc-sync
**Reasoning**: The invariant pipeline reports 3 specified-only claims but these were just addressed in this shift (2.6.1). After the claim-evidence patterns were added, there may be remaining gaps where code exists but evidence patterns don't cover it. Running `bun run setup` still shows "3 specified-only" — some may need their evidence patterns updated to correctly match the new code. Ref: `.shoe-makers/claim-evidence.yaml`, `.shoe-makers/invariants.md`.
