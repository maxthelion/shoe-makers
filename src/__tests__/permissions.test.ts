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

  test("executor can write root-level documentation files", () => {
    expect(isFileAllowed("execute-work-item", "CHANGELOG.md")).toBe(true);
    expect(isFileAllowed("execute-work-item", "README.md")).toBe(true);
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

  test("executor can write test files (bug-fix work items need tests alongside fix)", () => {
    expect(isFileAllowed("execute-work-item", "src/__tests__/foo.test.ts")).toBe(true);
    expect(isFileAllowed("execute-work-item", "src/__tests__/permissions.test.ts")).toBe(true);
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

describe("custom wikiDir", () => {
  test("getPermissions uses custom wikiDir in cannotWrite", () => {
    const perms = getPermissions("critique", "docs/wiki");
    expect(perms.cannotWrite).toContain("docs/wiki/");
    expect(perms.cannotWrite).not.toContain("wiki/");
  });

  test("getPermissions uses custom wikiDir in canWrite", () => {
    const perms = getPermissions("execute-work-item", "docs/wiki");
    expect(perms.canWrite).toContain("docs/wiki/");
    expect(perms.canWrite).not.toContain("wiki/");
  });

  test("reviewer cannot write to custom wiki dir", () => {
    expect(isFileAllowed("critique", "docs/wiki/pages/foo.md", "docs/wiki")).toBe(false);
  });

  test("old wiki/ path is not forbidden when wikiDir is different", () => {
    // With custom wikiDir, "wiki/" is no longer in cannotWrite for the reviewer.
    // But the reviewer still can't write there since "wiki/" isn't in canWrite either.
    // Test with inbox-handler which has broad canWrite including the wiki path.
    const perms = getPermissions("critique", "docs/wiki");
    expect(perms.cannotWrite).not.toContain("wiki/");
  });

  test("executor can write to custom wiki dir", () => {
    expect(isFileAllowed("execute-work-item", "docs/wiki/pages/foo.md", "docs/wiki")).toBe(true);
  });

  test("executor cannot write to old wiki/ when wikiDir is different", () => {
    // With custom wikiDir, "wiki/" is not in canWrite — only "docs/wiki/" is
    expect(isFileAllowed("execute-work-item", "wiki/pages/foo.md", "docs/wiki")).toBe(false);
  });

  test("checkPermissionViolations uses custom wikiDir", () => {
    const violations = checkPermissionViolations("critique", [
      ".shoe-makers/findings/critique-001.md",
      "docs/wiki/pages/foo.md",
    ], "docs/wiki");
    expect(violations).toEqual(["docs/wiki/pages/foo.md"]);
  });

  test("invariants.md is still forbidden with custom wikiDir", () => {
    for (const action of allActions) {
      expect(isFileAllowed(action, ".shoe-makers/invariants.md", "docs/wiki")).toBe(false);
    }
  });

  test("default wikiDir matches original behavior", () => {
    // Explicitly passing "wiki" should behave the same as not passing it
    expect(isFileAllowed("critique", "wiki/pages/foo.md", "wiki")).toBe(false);
    expect(isFileAllowed("execute-work-item", "wiki/pages/foo.md", "wiki")).toBe(true);
  });
});
