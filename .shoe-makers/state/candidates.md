# Candidates

## 1. Add claim-evidence for enriched prompt details
**Type**: implement
**Impact**: medium
**Reasoning**: The new `formatTopGaps` and `formatCodebaseSnapshot` functions in `src/prompts.ts` add assessment details to explore/prioritise prompts. These implement spec claims about richer context but may need claim-evidence entries if the invariants checker picks them up as unspecified code. Check whether `bun run setup` shows any new unspecified invariants after the last change. Files: `.shoe-makers/claim-evidence.yaml`, `src/prompts.ts`.

## 2. Shift summary block at end of shift log
**Type**: improve
**Impact**: high
**Reasoning**: `src/log/shift-summary.ts` generates a `ShiftSummary` that categorises actions into improvement types (fix, feature, test, docs, health, review) and tracks balance. But this summary is never written to the shift log. Adding a summary block at the end of each shift would transform the morning review — the human gets a 2-second overview of what was accomplished. The wiki (`wiki/pages/observability.md`) says "the shift log tells a narrative, not just facts." This is the most impactful UX improvement remaining. Files: `src/log/shift-summary.ts`, `src/shift.ts`, `src/log/shift-log.ts`.

## 3. Split prompts.test.ts into focused test files
**Type**: health
**Impact**: low
**Reasoning**: `src/__tests__/prompts.test.ts` is now the worst file in the codebase at 89/100 health score. It contains 5 describe blocks covering distinct concerns (core prompts, skill inclusion, skill matching, creative lens, tier switching). Splitting into `prompts-core.test.ts`, `prompts-skills.test.ts`, `prompts-tiers.test.ts` would improve readability and bring health back to 100/100. Low risk since tests are purely additive.
