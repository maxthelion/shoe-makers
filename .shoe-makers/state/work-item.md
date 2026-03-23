# Refactor prompts.ts — extract explore/prioritise prompt builders

skill-type: octoclean-fix

## Context

`src/prompts.ts` is 309 lines with health score 95/100. The `generatePrompt()` function (lines 79-309) is a single switch statement where two cases — `explore` (lines 228-307, ~80 lines) and `prioritise` (lines 183-226, ~43 lines) — contain duplicated tier-detection logic and complex inline string building. The other 7 cases are short and fine.

## Duplicated tier logic

Both `explore` and `prioritise` compute the same tier determination:

```typescript
// In explore (lines 229-232):
const eInv = state.blackboard.assessment?.invariants;
const eUntestedCount = eInv?.implementedUntested ?? 0;
const eSpecOnlyCount = eInv?.specifiedOnly ?? 0;
const eHasGaps = eSpecOnlyCount > 0 || eUntestedCount >= 5;

// In prioritise (lines 184-187):
const pInv = state.blackboard.assessment?.invariants;
const pUntestedCount = pInv?.implementedUntested ?? 0;
const pSpecOnlyCount = pInv?.specifiedOnly ?? 0;
const pHasGaps = pSpecOnlyCount > 0 || pUntestedCount >= 5;
```

These are identical except for variable prefixes.

## What to do

### Step 1: Extract `determineTier()` helper

Add a helper function (in the same file, before `generatePrompt`) that returns tier info:

```typescript
interface TierInfo {
  hasGaps: boolean;
  specOnlyCount: number;
  untestedCount: number;
}

function determineTier(assessment: WorldState["blackboard"]["assessment"]): TierInfo {
  const inv = assessment?.invariants;
  const untestedCount = inv?.implementedUntested ?? 0;
  const specOnlyCount = inv?.specifiedOnly ?? 0;
  return { hasGaps: specOnlyCount > 0 || untestedCount >= 5, specOnlyCount, untestedCount };
}
```

### Step 2: Extract `buildExplorePrompt()` and `buildPrioritisePrompt()`

Move the explore and prioritise cases into standalone functions:

```typescript
function buildExplorePrompt(
  state: WorldState,
  skills?: Map<string, SkillDefinition>,
  article?: { title: string; summary: string },
): string {
  const tier = determineTier(state.blackboard.assessment);
  // ... rest of explore logic
}

function buildPrioritisePrompt(state: WorldState): string {
  const tier = determineTier(state.blackboard.assessment);
  // ... rest of prioritise logic
}
```

### Step 3: Simplify the switch

The explore and prioritise cases become one-liners:

```typescript
case "explore":
  return buildExplorePrompt(state, skills, article);
case "prioritise":
  return buildPrioritisePrompt(state);
```

### Patterns to follow

- The existing helpers (`formatTopGaps`, `formatCodebaseSnapshot`, `formatSkillCatalog`) at lines 44-71 are the right pattern — private functions that build prompt sections.
- Keep all functions in `src/prompts.ts` (don't create a new file — it's not complex enough to warrant splitting into a module).
- Keep all functions non-exported (private to the module) except `generatePrompt` and `ACTION_TO_SKILL_TYPE`.

### Tests to update

The existing tests in `src/__tests__/prompts.test.ts` should continue to pass unchanged. The refactoring is internal — the public API (`generatePrompt`) doesn't change. Run `bun test` to verify.

If any test breaks, it means the refactoring changed behaviour — fix the refactoring, not the test.

### What NOT to change

- Do NOT change the prompt text content — this is a structural refactor only
- Do NOT change the function signature of `generatePrompt`
- Do NOT change `OFF_LIMITS`, `ACTION_TO_SKILL_TYPE`, or the short action cases (fix-tests, critique, review, inbox, execute-work-item, dead-code)
- Do NOT create new files — keep everything in `src/prompts.ts`
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages
