# Update claim-evidence.yaml to match refactored prompts.ts variable names

skill-type: fix

## Problem

The prompts.ts refactor (commit 9050b0f) extracted `buildExplorePrompt` and `buildPrioritisePrompt` as standalone functions. Variable names were cleaned up:
- `pTierGuidance` → `tierGuidance` (in `buildPrioritisePrompt`, line 181)
- `eHasGaps` / `pHasGaps` → `tier.hasGaps` (in `determineTier`, line 86, used at lines 114 and 181)

But `.shoe-makers/claim-evidence.yaml` still references the old names, causing 3 invariants to show as "specified-only".

## Spec reference

From `.shoe-makers/invariants.md` section 2.4-2.5:
> "This is the LLM judgement step — it weighs impact and balance across work types"
> "The explore and prioritise prompts receive invariant counts and shift behaviour based on which tier the system is in"
> "Impact is the primary criterion — not risk-avoidance"

## Exactly what to change

In `.shoe-makers/claim-evidence.yaml`:

### 1. Line 1723: `pTierGuidance` → `tierGuidance`
The claim `spec.the-prioritiser-writes-the-real-prompt.this-is-the-llm-judgement-step-it-weighs-impact-and-balance-:` has source evidence `[pTierGuidance]`. Change to `[tierGuidance]`.

### 2. Lines 1764-1765: `eHasGaps` and `pHasGaps` → `tier.hasGaps` or `hasGaps`
The claim `spec.hierarchy-of-needs-in-prioritisation.the-explore-and-prioritise-prompts-receive-invariant-counts-:` has source evidence `[eHasGaps]` and `[pHasGaps]`. Change both to `[hasGaps]` (the field name in the `TierInfo` interface at prompts.ts line 77).

### 3. Line 1790: `pTierGuidance` → `tierGuidance`
The claim `spec.hierarchy-of-needs-in-prioritisation.impact-is-the-primary-criterion-not-riskavoidance:` has source evidence `[pTierGuidance]`. Change to `[tierGuidance]`.

## What tests to write

No new tests needed — the existing invariant checks will pass once the evidence patterns match the code again. Run `bun test` to confirm all 531+ tests still pass and check that `bun run setup` shows 0 specified-only for these 3 claims.

## What NOT to change

- Do NOT modify `src/prompts.ts` or any file in `src/`
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the claim IDs — only update the evidence patterns within existing claims
- Do NOT change test evidence patterns — only source evidence needs updating
