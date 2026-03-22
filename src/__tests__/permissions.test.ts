import { describe, test, expect } from "bun:test";
import {
  getPermissions,
  isFileAllowed,
  checkPermissionViolations,
} from "../verify/permissions";
import type { ActionType } from "../types";

const allActions: ActionType[] = [
  "fix-tests",
  "fix-critique",
  "critique",
  "review",
  "inbox",
  "execute-work-item",
  "prioritise",
  "explore",
];

describe("getPermissions", () => {
  test("returns permissions for every action type", () => {
    for (const action of allActions) {
      const perms = getPermissions(action);
      expect(perms.role).toBeTruthy();
      expect(perms.canWrite.length).toBeGreaterThan(0);
      expect(perms.cannotWrite.length).toBeGreaterThan(0);
    }
  });

  test("invariants.md is forbidden for all actions", () => {
    for (const action of allActions) {
      const perms = getPermissions(action);
      expect(perms.cannotWrite).toContain(".shoe-makers/invariants.md");
    }
  });
});

describe("isFileAllowed", () => {
  test("reviewer can write findings", () => {
    expect(isFileAllowed("critique", ".shoe-makers/findings/critique-001.md")).toBe(true);
  });

  test("reviewer cannot write source code", () => {
    expect(isFileAllowed("critique", "src/types.ts")).toBe(false);
  });

  test("reviewer cannot write wiki", () => {
    expect(isFileAllowed("critique", "wiki/pages/architecture.md")).toBe(false);
  });

  test("executor can write source code", () => {
    expect(isFileAllowed("execute-work-item", "src/verify/permissions.ts")).toBe(true);
  });

  test("executor can write wiki", () => {
    expect(isFileAllowed("execute-work-item", "wiki/pages/architecture.md")).toBe(true);
  });

  test("executor can write state files", () => {
    expect(isFileAllowed("execute-work-item", ".shoe-makers/state/work-item.md")).toBe(true);
  });

  test("prioritiser can write state files", () => {
    expect(isFileAllowed("prioritise", ".shoe-makers/state/work-item.md")).toBe(true);
    expect(isFileAllowed("prioritise", ".shoe-makers/state/candidates.md")).toBe(true);
  });

  test("prioritiser cannot write source or wiki", () => {
    expect(isFileAllowed("prioritise", "src/types.ts")).toBe(false);
    expect(isFileAllowed("prioritise", "wiki/pages/foo.md")).toBe(false);
  });

  test("no action can write invariants.md", () => {
    for (const action of allActions) {
      expect(isFileAllowed(action, ".shoe-makers/invariants.md")).toBe(false);
    }
  });

  test("executor cannot write test files (TDD enforcement)", () => {
    expect(isFileAllowed("execute-work-item", "src/__tests__/foo.test.ts")).toBe(false);
    expect(isFileAllowed("execute-work-item", "src/__tests__/permissions.test.ts")).toBe(false);
  });

  test("fix-tests can write test files (exception for test fixers)", () => {
    expect(isFileAllowed("fix-tests", "src/__tests__/foo.test.ts")).toBe(true);
    expect(isFileAllowed("fix-tests", "src/types.ts")).toBe(true);
  });

  test("explore can write state and findings", () => {
    expect(isFileAllowed("explore", ".shoe-makers/state/candidates.md")).toBe(true);
    expect(isFileAllowed("explore", ".shoe-makers/findings/note.md")).toBe(true);
    expect(isFileAllowed("explore", "src/types.ts")).toBe(false);
    expect(isFileAllowed("explore", "wiki/pages/foo.md")).toBe(false);
  });
});

describe("checkPermissionViolations", () => {
  test("returns empty array when all files are allowed", () => {
    const violations = checkPermissionViolations("execute-work-item", [
      "src/types.ts",
      "src/verify/permissions.ts",
    ]);
    expect(violations).toEqual([]);
  });

  test("returns violating files", () => {
    const violations = checkPermissionViolations("critique", [
      ".shoe-makers/findings/critique-001.md",
      "src/types.ts",
      "wiki/pages/foo.md",
    ]);
    expect(violations).toEqual(["src/types.ts", "wiki/pages/foo.md"]);
  });

  test("catches invariants.md modification", () => {
    const violations = checkPermissionViolations("execute-work-item", [
      "src/types.ts",
      ".shoe-makers/invariants.md",
    ]);
    expect(violations).toEqual([".shoe-makers/invariants.md"]);
  });
});
