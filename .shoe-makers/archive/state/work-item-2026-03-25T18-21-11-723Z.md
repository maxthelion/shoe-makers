# Add tests for blackboard and permission-setup modules

skill-type: test

## Goal

Add dedicated tests for `src/state/blackboard.ts` and `src/scheduler/permission-setup.ts` — two runtime-critical modules with zero test coverage.

## Context

From wiki `verification.md`: "Automated verification gate: run tests → check health → commit/revert" and "Role-based permissions table" — both modules implement these spec requirements but have no tests proving correctness.

## Module 1: `src/state/blackboard.ts` (69 lines)

Exports: `readBlackboard()`, `writeAssessment()`, `writeCurrentTask()`

Key behaviors to test:
- `readBlackboard(repoRoot)` reads `assessment.json` and `current-task.json` from `.shoe-makers/state/`, returning `{ assessment, currentTask }`
- Returns `null` for each field if the file doesn't exist (ENOENT handling at line 24)
- Re-throws non-ENOENT errors (line 27)
- `writeAssessment(repoRoot, data)` creates the directory and writes `assessment.json`
- `writeCurrentTask(repoRoot, data)` creates the directory and writes `current-task.json`
- Round-trip: write then read should return the same data

### Test file: `src/__tests__/blackboard.test.ts`

```ts
import { describe, test, expect } from "bun:test";
import { readBlackboard, writeAssessment, writeCurrentTask } from "../state/blackboard";
import { withTempDir } from "./test-utils";
import { readFile, mkdir, writeFile } from "fs/promises";
import { join } from "path";

describe("readBlackboard", () => {
  test("returns nulls when state dir does not exist", async () => {
    await withTempDir("bb", async (dir) => {
      const bb = await readBlackboard(dir);
      expect(bb.assessment).toBeNull();
      expect(bb.currentTask).toBeNull();
    });
  });

  test("reads assessment.json when present", async () => {
    await withTempDir("bb", async (dir) => {
      const stateDir = join(dir, ".shoe-makers", "state");
      await mkdir(stateDir, { recursive: true });
      await writeFile(join(stateDir, "assessment.json"), JSON.stringify({ testsPass: true }));
      const bb = await readBlackboard(dir);
      expect(bb.assessment).toEqual({ testsPass: true });
    });
  });

  test("returns null for missing assessment but reads currentTask", async () => {
    await withTempDir("bb", async (dir) => {
      const stateDir = join(dir, ".shoe-makers", "state");
      await mkdir(stateDir, { recursive: true });
      await writeFile(join(stateDir, "current-task.json"), JSON.stringify({ status: "done" }));
      const bb = await readBlackboard(dir);
      expect(bb.assessment).toBeNull();
      expect(bb.currentTask).toEqual({ status: "done" });
    });
  });
});

describe("writeAssessment", () => {
  test("creates state dir and writes assessment.json", async () => {
    await withTempDir("bb", async (dir) => {
      const data = { testsPass: true, healthScore: 99 };
      await writeAssessment(dir, data as any);
      const content = await readFile(join(dir, ".shoe-makers", "state", "assessment.json"), "utf-8");
      expect(JSON.parse(content)).toEqual(data);
    });
  });

  test("round-trip: write then read returns same data", async () => {
    await withTempDir("bb", async (dir) => {
      const data = { testsPass: false, healthScore: 50, timestamp: "2026-01-01" };
      await writeAssessment(dir, data as any);
      const bb = await readBlackboard(dir);
      expect(bb.assessment).toEqual(data);
    });
  });
});

describe("writeCurrentTask", () => {
  test("creates state dir and writes current-task.json", async () => {
    await withTempDir("bb", async (dir) => {
      const data = { status: "in-progress" as const };
      await writeCurrentTask(dir, data as any);
      const content = await readFile(join(dir, ".shoe-makers", "state", "current-task.json"), "utf-8");
      expect(JSON.parse(content)).toEqual(data);
    });
  });
});
```

## Module 2: `src/scheduler/permission-setup.ts` (42 lines)

Exports: `setupPermissionContext(repoRoot, skill)`

Key behaviors to test:
- Reads previous action from `last-action.md` (via `readLastAction`)
- Parses the action type and writes it to `previous-action-type` file
- When `skill !== "critique"`, returns undefined (short-circuits at line 30)
- When `skill === "critique"`, calls `detectPermissionViolations` and writes findings if violations found
- Returns the violations array

### Test file: `src/__tests__/permission-setup.test.ts`

Test scenarios:
1. Returns undefined when skill is not "critique"
2. Writes previous-action-type file when last action exists
3. Does not write previous-action-type when no last action
4. Returns violations when skill is "critique" and violations exist
5. Returns empty array when skill is "critique" and no violations

**Note**: This module depends on `readLastAction`, `detectPermissionViolations`, and `writePermissionViolationFinding`. Use the `withTempDir` helper and write minimal state files to test through the real functions rather than mocking.

## Patterns to follow

- Use `withTempDir` from `test-utils.ts` for temporary directory management
- Follow the pattern in `src/__tests__/invariants.test.ts` or `src/__tests__/world.test.ts` for file-based tests
- Keep tests focused on behavior, not implementation details
- Use `as any` sparingly for test data that doesn't need full type compliance

## Tests to verify

- Run `bun test` — all tests must pass (903 existing + new)

## What NOT to change

- Do not modify any existing source files
- Do not modify any existing test files
- Do not modify `.shoe-makers/invariants.md`
- Only create `src/__tests__/blackboard.test.ts` and `src/__tests__/permission-setup.test.ts`

## Decision Rationale

Chose candidate #2 (test coverage) over #1 (more octoclean-fix). The remaining health gains from octoclean-fix are marginal (92→higher) and we already did one round. Testing blackboard and permission-setup adds real safety for runtime-critical modules. The instruction says "prefer improvement and creative work over writing more tests," but untested state-persistence code is a concrete risk — not polish.
