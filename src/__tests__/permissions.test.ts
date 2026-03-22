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
  "implement-plan",
  "implement-spec",
  "write-tests",
  "document",
  "improve-health",
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

  test("implementer can write source code", () => {
    expect(isFileAllowed("implement-spec", "src/verify/permissions.ts")).toBe(true);
  });

  test("implementer cannot write wiki", () => {
    expect(isFileAllowed("implement-spec", "wiki/pages/architecture.md")).toBe(false);
  });

  test("doc-writer can write wiki", () => {
    expect(isFileAllowed("document", "wiki/pages/architecture.md")).toBe(true);
  });

  test("doc-writer cannot write source", () => {
    expect(isFileAllowed("document", "src/types.ts")).toBe(false);
  });

  test("test-writer can write tests", () => {
    expect(isFileAllowed("write-tests", "src/__tests__/foo.test.ts")).toBe(true);
  });

  test("test-writer cannot write non-test source (TDD enforcement)", () => {
    expect(isFileAllowed("write-tests", "src/types.ts")).toBe(false);
    expect(isFileAllowed("write-tests", "src/verify/permissions.ts")).toBe(false);
  });

  test("write-tests role name is test-writer", () => {
    const perms = getPermissions("write-tests");
    expect(perms.role).toBe("test-writer");
  });

  test("no action can write invariants.md", () => {
    for (const action of allActions) {
      expect(isFileAllowed(action, ".shoe-makers/invariants.md")).toBe(false);
    }
  });

  test("explore can only write findings", () => {
    expect(isFileAllowed("explore", ".shoe-makers/findings/note.md")).toBe(true);
    expect(isFileAllowed("explore", "src/types.ts")).toBe(false);
    expect(isFileAllowed("explore", "wiki/pages/foo.md")).toBe(false);
  });
});

describe("checkPermissionViolations", () => {
  test("returns empty array when all files are allowed", () => {
    const violations = checkPermissionViolations("implement-spec", [
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
    const violations = checkPermissionViolations("implement-spec", [
      "src/types.ts",
      ".shoe-makers/invariants.md",
    ]);
    expect(violations).toEqual([".shoe-makers/invariants.md"]);
  });
});
