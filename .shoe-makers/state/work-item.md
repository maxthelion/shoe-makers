# Extract remaining inline prompts from generatePrompt switch statement

skill-type: health

## Problem

`src/prompts.ts` (score 94/100) has a switch statement at lines 234-334 with 9 cases. Two cases (`prioritise` and `explore`) already delegate to extracted functions (`buildPrioritisePrompt` and `buildExplorePrompt`). The remaining 7 cases are inline template strings. Extracting them as named functions will reduce the switch to pure delegation, improving readability and reducing cyclomatic complexity.

## Pattern to follow

Follow the pattern established in commit 9050b0f for `buildExplorePrompt` and `buildPrioritisePrompt`:

```typescript
function buildFixTestsPrompt(skillSection: string): string {
  return `# Fix Failing Tests
...${skillSection}${OFF_LIMITS}`;
}
```

Place the new functions above the `generatePrompt` function (between line 221 and the current `generatePrompt` function), alongside the existing `buildExplorePrompt` and `buildPrioritisePrompt`.

## Exactly what to extract

### 1. `buildFixTestsPrompt(skillSection: string): string` — case "fix-tests" (line 235-240)
### 2. `buildFixCritiquePrompt(): string` — case "fix-critique" (lines 242-254)
No skillSection needed (not used in this case).
### 3. `buildCritiquePrompt(): string` — case "critique" (lines 256-280)
Note: this case does NOT use `OFF_LIMITS` or `skillSection`. It has its own custom off-limits text. Keep it exactly as-is.
### 4. `buildReviewPrompt(): string` — case "review" (lines 282-292)
### 5. `buildInboxPrompt(state: WorldState): string` — case "inbox" (lines 294-297)
Needs `state.inboxCount`.
### 6. `buildExecutePrompt(skillSection: string): string` — case "execute-work-item" (lines 299-313)
### 7. `buildDeadCodePrompt(skillSection: string): string` — case "dead-code" (lines 315-327)

## After extraction, the switch should look like:

```typescript
switch (action) {
  case "fix-tests":
    return buildFixTestsPrompt(skillSection);
  case "fix-critique":
    return buildFixCritiquePrompt();
  case "critique":
    return buildCritiquePrompt();
  case "review":
    return buildReviewPrompt();
  case "inbox":
    return buildInboxPrompt(state);
  case "execute-work-item":
    return buildExecutePrompt(skillSection);
  case "dead-code":
    return buildDeadCodePrompt(skillSection);
  case "prioritise":
    return buildPrioritisePrompt(state);
  case "explore":
    return buildExplorePrompt(state, skills, article);
}
```

## What tests to write

No new tests needed. The existing tests in `src/__tests__/prompts.test.ts` already cover all 9 action types with `promptCases` (20 test cases) and `tierCases` (12 test cases). Run `bun test` to confirm all 531+ tests pass.

## What NOT to change

- Do NOT change the template string content — only extract it into functions
- Do NOT change `buildExplorePrompt` or `buildPrioritisePrompt` — they're already extracted
- Do NOT modify test files
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the function signatures or parameter types of `generatePrompt`
