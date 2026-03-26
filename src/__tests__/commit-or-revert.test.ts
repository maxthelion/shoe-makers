import { describe, test, expect } from "bun:test";
import { verifyOrRevert } from "../verify/commit-or-revert";

describe("verifyOrRevert", () => {
  test("returns commit when tests and typecheck pass", () => {
    const result = verifyOrRevert(true, true);
    expect(result.decision).toBe("commit");
    expect(result.testsPass).toBe(true);
    expect(result.typecheckPass).toBe(true);
  });

  test("returns revert when tests fail", () => {
    const result = verifyOrRevert(false, true);
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("tests failing");
  });

  test("returns revert when typecheck fails", () => {
    const result = verifyOrRevert(true, false);
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("typecheck failing");
  });

  test("returns revert when both fail", () => {
    const result = verifyOrRevert(false, false);
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("tests failing");
    expect(result.reason).toContain("typecheck failing");
  });

  test("commit result includes positive reason", () => {
    const result = verifyOrRevert(true, true);
    expect(result.reason).toContain("pass");
  });

  test("revert result includes failure details", () => {
    const result = verifyOrRevert(false, false);
    expect(result.reason).toContain("Reverting");
  });
});
