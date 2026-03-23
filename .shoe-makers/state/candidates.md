# Candidates

## 1. Extract prompt builders into separate modules to improve health score
**Type**: health
**Impact**: medium
**Reasoning**: `src/prompts.ts` scores 93/100 — the lowest in the codebase — because it contains 16 functions in a single 361-line file. The fix is straightforward: extract the builder functions into `src/prompts/` submodules grouped by concern (reactive prompts, three-phase prompts, helpers). This would bring the file health to 98+ without changing any behaviour, and it follows the existing pattern of `src/skills/` and `src/state/` being directories. Tests in `src/__tests__/prompts.test.ts` (95/100) would similarly benefit from being split. The public API (`generatePrompt`) stays unchanged — only internal organisation improves.

## 2. Add shift summary generation to make morning review faster
**Type**: implement
**Impact**: high
**Reasoning**: The wiki spec (`wiki/pages/architecture.md`) describes observability as a core principle, and the shift log captures per-tick narrative. But there's no end-of-shift summary that answers: "What did the elves accomplish tonight?" `src/log/shift-summary.ts` exists and categorises work, but it's not wired into the setup or shift flow as a final artifact. Adding a `generate-shift-summary` step that runs at shift end (or when max ticks reached) would produce a `.shoe-makers/log/summary-YYYY-MM-DD.md` with: work completed (by category), findings raised, health delta, and open items for tomorrow. This directly serves the human user's morning review workflow.

## 3. Improve prompts.ts determineTier to use graduated scoring
**Type**: health
**Impact**: medium
**Reasoning**: `determineTier()` in `src/prompts.ts:88-93` uses a binary check (`specOnlyCount > 0 || untestedCount >= 5`). This means the system jumps from "hygiene mode" to "full innovation mode" with no gradient. A graduated approach (scoring health, test status, findings count, invariant alignment on a 0-5 scale) would let the prioritiser make better trade-offs — e.g., "mostly innovation but one spec gap exists, consider closing it". This is a small change (modify `determineTier` return type and the two call sites in `buildExplorePrompt`/`buildPrioritisePrompt`) but would produce noticeably better prompt guidance.
