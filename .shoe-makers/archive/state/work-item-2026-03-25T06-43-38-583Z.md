# Fix incomplete skill list in init.test.ts

skill-type: test-coverage

## Problem

`src/__tests__/init.test.ts` has two tests that only check 5 of the 9 skill files that `src/init.ts` scaffolds:

- Line 62: "scaffolds all core skills" — checks `["fix-tests.md", "implement.md", "test-coverage.md", "doc-sync.md", "health.md"]`
- Line 73: "scaffolded skills have valid frontmatter" — same 5 skills

Missing from both: `octoclean-fix.md`, `bug-fix.md`, `dead-code.md`, `dependency-update.md` (see `src/init.ts:62-65`).

## What to do

### 1. Update the skill list in both tests (lines 65 and 76)

Change the `coreSkills` array in both tests to include all 9 skills:

```typescript
const coreSkills = [
  "fix-tests.md", "implement.md", "test-coverage.md", "doc-sync.md", "health.md",
  "octoclean-fix.md", "bug-fix.md", "dead-code.md", "dependency-update.md",
];
```

### 2. Update the test name (line 62)

Change from:
```
"scaffolds all core skills: fix-tests, implement, test-coverage, doc-sync, health"
```
To:
```
"scaffolds all core skills"
```

(Listing all 9 in the test name would be too long.)

### 3. Run tests

Run `bun test src/__tests__/init.test.ts` then `bun test` to verify.

## What NOT to change

- Do not modify `src/init.ts` or the skill template files
- Do not modify other test files
- Do not change the skill content assertions (frontmatter checks are correct)

## Decision Rationale

This is a straightforward test accuracy fix. The test claims to check "all core skills" but misses 4 of 9. If a future skill is added to init.ts but breaks, these tests won't catch it.
