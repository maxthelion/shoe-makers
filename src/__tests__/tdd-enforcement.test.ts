import { describe, test, expect } from "bun:test";
import { isFileAllowed, getPermissions } from "../verify/permissions";

describe("permission enforcement", () => {
  test("executor can write source, wiki, and state files", () => {
    expect(isFileAllowed("execute-work-item", "src/types.ts")).toBe(true);
    expect(isFileAllowed("execute-work-item", "wiki/pages/foo.md")).toBe(true);
    expect(isFileAllowed("execute-work-item", ".shoe-makers/state/work-item.md")).toBe(true);
  });

  test("executor can write test files (bug-fix work items need tests alongside fix)", () => {
    expect(isFileAllowed("execute-work-item", "src/__tests__/foo.test.ts")).toBe(true);
  });

  test("executor cannot write invariants.md", () => {
    expect(isFileAllowed("execute-work-item", ".shoe-makers/invariants.md")).toBe(false);
  });

  test("prioritiser can only write state files", () => {
    expect(isFileAllowed("prioritise", ".shoe-makers/state/work-item.md")).toBe(true);
    expect(isFileAllowed("prioritise", ".shoe-makers/state/candidates.md")).toBe(true);
    expect(isFileAllowed("prioritise", "src/types.ts")).toBe(false);
    expect(isFileAllowed("prioritise", "wiki/pages/foo.md")).toBe(false);
  });

  test("explorer can write state and findings only", () => {
    expect(isFileAllowed("explore", ".shoe-makers/state/candidates.md")).toBe(true);
    expect(isFileAllowed("explore", ".shoe-makers/findings/note.md")).toBe(true);
    expect(isFileAllowed("explore", "src/types.ts")).toBe(false);
  });

  test("fix-tests can write both source and tests (fixing requires both)", () => {
    expect(isFileAllowed("fix-tests", "src/types.ts")).toBe(true);
    expect(isFileAllowed("fix-tests", "src/__tests__/foo.test.ts")).toBe(true);
  });

  test("reviewer cannot write source or wiki", () => {
    expect(isFileAllowed("critique", "src/types.ts")).toBe(false);
    expect(isFileAllowed("critique", "wiki/pages/foo.md")).toBe(false);
    expect(isFileAllowed("critique", ".shoe-makers/findings/critique-001.md")).toBe(true);
  });
});
