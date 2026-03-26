# Consolidate buildCritiquePrompt tests to reduce prompt-builders.test.ts LOC

skill-type: octoclean-fix

## Goal

Reduce the line count of `src/__tests__/prompt-builders.test.ts` (currently 370 lines, score 92) by consolidating the `buildCritiquePrompt` describe block, which is the largest section (lines 57-132, 76 lines with 12 tests).

## Problem

The `buildCritiquePrompt` section has multiple tests that call `buildCritiquePrompt()` with no arguments and check for static content. These could be consolidated into fewer tests without losing coverage. For example:
- "includes review steps" (4 expects) and "includes all 5 wiki verification criteria" (5 expects) both call `buildCritiquePrompt()` with no args
- "includes clean pass guidance" and "requires verdict format" each have 1-2 expects on the same prompt

## Changes to make

In `src/__tests__/prompt-builders.test.ts`:

1. **Merge the static-content critique tests** into fewer tests. For example, combine "includes review steps", "reviewers cannot modify src or wiki", "includes all 5 wiki verification criteria", "includes clean pass guidance", and "requires verdict format" into 2 tests: one for review process steps and one for compliance checks.

2. **Keep the parameterized tests separate** — the violations and validation pattern tests vary by input and should stay as-is.

Example consolidation:
```ts
test("includes review process steps and scope restrictions", () => {
  const result = buildCritiquePrompt();
  // Review steps
  expect(result).toContain("last-action.md");
  expect(result).toContain("last-reviewed-commit");
  expect(result).toContain("git log");
  expect(result).toContain("git diff");
  // Scope
  expect(result).toContain("reviewers can only write findings");
});

test("includes verification criteria and verdict format", () => {
  const result = buildCritiquePrompt();
  expect(result).toContain("Did the elf stay within its permitted files");
  expect(result).toContain("Does the code correctly implement what was asked");
  expect(result).toContain("Do the tests actually verify the behaviour");
  expect(result).toContain("Were any invariants or evidence patterns modified to game the system");
  expect(result).toContain("Does the change match the wiki spec");
  expect(result).toContain("Not every review must find problems");
  expect(result).toContain("Compliant");
  expect(result).toContain("Non-compliant");
});
```

3. Similarly, the `buildEvaluateInsightPrompt` tests (lines 351-369) call the same function 3 times — consolidate into 1 test.

## Tests to verify

- Run `bun test` — all tests must pass
- Run octoclean scan + report — prompt-builders score should improve

## What NOT to change

- Do not change validation/violations tests (they have different inputs)
- Do not change any other test files
- Do not change source code files
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Chose candidate #1 (octoclean-fix) as the most actionable improvement. The buildCritiquePrompt tests call the same function with no args in 7 separate tests that could be 2 tests. This is pure LOC reduction with zero coverage loss. Other candidates are lower impact — the project is in excellent health.
