# Candidates

## 1. Improve prompts.ts health score from 93 back to 94+
**Type**: health
**Impact**: high
**Reasoning**: The refactor in the previous tick extracted 7 functions but this added function declarations that octoclean counts as complexity. The score dropped from 94 to 93. Possible fix: consolidate the simpler builders (buildFixTestsPrompt, buildFixCritiquePrompt, buildReviewPrompt) which are very short (3-5 lines) back as inline returns, keeping only the longer ones extracted. Or reduce complexity elsewhere in the file — e.g., simplify `formatTopGaps` or `formatCodebaseSnapshot`. File: `src/prompts.ts`.

## 2. Add creative lens feature to README
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `README.md` doesn't mention the creative lens feature (Wikipedia article fetching during explore phases). This is implemented in `src/creative/wikipedia.ts` and integrated into `src/setup.ts`. Invariant 3.5 says "The README reflects current capabilities." File: `README.md`.

## 3. Make ACTION_TO_SKILL_TYPE exhaustive for type safety
**Type**: improve
**Impact**: low
**Reasoning**: `src/prompts.ts` line 12 defines `ACTION_TO_SKILL_TYPE` as `Partial<Record<ActionType, string>>`. Changing to `Record<ActionType, string | undefined>` with explicit entries for all 9 actions ensures TypeScript catches new ActionType additions. File: `src/prompts.ts` lines 12-16.
