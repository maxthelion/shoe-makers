# Consolidate file-existence checks in world.test.ts

skill-type: octoclean-fix

## Goal

Reduce LOC in `src/__tests__/world.test.ts` (350 lines, score 93) by parameterizing the identical checkHasWorkItem, checkHasCandidates, and checkHasPartialWork test patterns.

## Changes

Replace the three separate describe blocks for `checkHasWorkItem`, `checkHasCandidates`, and `checkHasPartialWork` (lines 182-243, ~62 lines) with a parameterized test that iterates over the three functions:

```ts
const fileExistenceChecks = [
  { name: "checkHasWorkItem", fn: checkHasWorkItem, file: "work-item.md" },
  { name: "checkHasCandidates", fn: checkHasCandidates, file: "candidates.md" },
  { name: "checkHasPartialWork", fn: checkHasPartialWork, file: "partial-work.md" },
] as const;

for (const { name, fn, file } of fileExistenceChecks) {
  describe(name, () => {
    test(`returns true when ${file} exists`, async () => {
      await withTempDir(name, async (dir) => {
        await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
        await writeFile(join(dir, ".shoe-makers", "state", file), `# ${name}`);
        expect(await fn(dir)).toBe(true);
      });
    });

    test(`returns false when ${file} does not exist`, async () => {
      await withTempDir(name, async (dir) => {
        await mkdir(join(dir, ".shoe-makers", "state"), { recursive: true });
        expect(await fn(dir)).toBe(false);
      });
    });

    test("returns false when state directory does not exist", async () => {
      await withTempDir(name, async (dir) => {
        expect(await fn(dir)).toBe(false);
      });
    });
  });
}
```

Note: checkHasCandidates only has 2 tests (no "state dir does not exist" test), so the parameterized version adds that test. That's fine.

## What NOT to change

- Do not change the checkUnreviewedCommits or countUnresolvedCritiques sections
- Do not change any source files
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Chose world.test.ts consolidation as the most impactful — it's the worst-scoring file and has clear parameterization opportunities.
