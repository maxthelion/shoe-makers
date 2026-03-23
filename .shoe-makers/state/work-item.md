# Work Item: Add README accuracy check to explore prompt

## What

Add a step to the explore prompt in `src/prompts.ts` that tells the elf to check whether README.md accurately describes current capabilities and flag drift as a candidate.

## Why

Invariant `spec.project-documentation.the-explore-step-checks-whether-the-readme-is-accurate` is specified-only. The explore prompt has 6 steps but none mention README. This is a one-step prompt change.

## Spec Reference

From `.shoe-makers/invariants.md` section 3.5:
> - The explore step checks whether the README is accurate and flags drift as a candidate

## What to Change

### `src/prompts.ts` — explore case (line ~169)

Add step 7 after step 6:

```
7. Check whether \`README.md\` accurately describes current capabilities — flag any drift as a candidate
```

### `.shoe-makers/claim-evidence.yaml`

Add evidence pattern for the invariant:

```yaml
spec.project-documentation.the-explore-step-checks-whether-the-readme-is-accurate-and-f:
  source:
    - [README.md]
    - [explore]
    - [drift, accurate]
  test:
    - [explore]
    - [README]
```

### `src/__tests__/prompts.test.ts`

Add test:
```typescript
test("explore prompt mentions README accuracy check", () => {
  const prompt = generatePrompt("explore", makeState());
  expect(prompt).toContain("README.md");
});
```

## What NOT to Change

- Do NOT modify README.md itself
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the existing 6 steps — add step 7 after them
