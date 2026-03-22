import { describe, test, expect } from "bun:test";
import { isFileAllowed, getPermissions } from "../verify/permissions";

describe("TDD enforcement via permissions", () => {
  test("implement-spec cannot write test files (elf making tests pass cannot modify tests)", () => {
    expect(isFileAllowed("implement-spec", "src/__tests__/foo.test.ts")).toBe(false);
    expect(isFileAllowed("implement-spec", "src/__tests__/bar.test.ts")).toBe(false);
  });

  test("implement-spec can still write non-test source files", () => {
    expect(isFileAllowed("implement-spec", "src/types.ts")).toBe(true);
    expect(isFileAllowed("implement-spec", "src/verify/permissions.ts")).toBe(true);
  });

  test("implement-plan cannot write test files", () => {
    expect(isFileAllowed("implement-plan", "src/__tests__/foo.test.ts")).toBe(false);
  });

  test("implement-plan can write source and wiki", () => {
    expect(isFileAllowed("implement-plan", "src/types.ts")).toBe(true);
    expect(isFileAllowed("implement-plan", "wiki/pages/foo.md")).toBe(true);
  });

  test("write-tests cannot write non-test source (test writer can't implement)", () => {
    expect(isFileAllowed("write-tests", "src/types.ts")).toBe(false);
    expect(isFileAllowed("write-tests", "src/verify/permissions.ts")).toBe(false);
  });

  test("write-tests CAN write test files", () => {
    expect(isFileAllowed("write-tests", "src/__tests__/foo.test.ts")).toBe(true);
  });

  test("fix-tests can write both source and tests (fixing requires both)", () => {
    expect(isFileAllowed("fix-tests", "src/types.ts")).toBe(true);
    expect(isFileAllowed("fix-tests", "src/__tests__/foo.test.ts")).toBe(true);
  });

  test("improve-health cannot write test files", () => {
    expect(isFileAllowed("improve-health", "src/__tests__/foo.test.ts")).toBe(false);
  });

  test("improve-health can write non-test source", () => {
    expect(isFileAllowed("improve-health", "src/types.ts")).toBe(true);
  });
});
