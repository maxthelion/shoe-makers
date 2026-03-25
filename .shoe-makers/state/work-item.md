# Add tests for logAssessment typecheck=false and typecheck=null

skill-type: test

## What to test

Add two tests to `src/__tests__/setup.test.ts` in the existing `logAssessment` describe block:

1. **typecheck=false** → should log "[setup] Typecheck: FAIL"
2. **typecheck=null** → should log "[setup] Typecheck: skipped"

## Pattern to follow

Look at the existing test at line 82-88:
```typescript
test("logs typecheck status when present", () => {
  const logSpy = spyOn(console, "log");
  const assessment = makeAssessment({ typecheckPass: true });
  logAssessment(assessment);
  const logs = logSpy.mock.calls.map((c) => c[0]);
  expect(logs).toContain("[setup] Typecheck: pass");
  logSpy.mockRestore();
});
```

## What NOT to change

- Do NOT modify any source files
- Do NOT modify `.shoe-makers/invariants.md`
- Only add tests to `src/__tests__/setup.test.ts`
