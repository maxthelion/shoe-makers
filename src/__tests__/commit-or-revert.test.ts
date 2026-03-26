import { describe, test, expect } from "bun:test";
import { verify } from "../verify/commit-or-revert";

describe("commit-or-revert verification gate", () => {
  test("returns commit when tests pass and health is stable", () => {
    const result = verify(true, null);
    expect(result.decision).toBe("commit");
    expect(result.reason).toContain("pass");
  });

  test("returns revert when tests fail", () => {
    const result = verify(false, null);
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("Tests");
  });

  test("returns revert when health regresses", () => {
    const result = verify(true, "Health dropped from 99 to 90");
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("Health");
  });

  test("tests failing takes priority over health", () => {
    const result = verify(false, "Health dropped");
    expect(result.decision).toBe("revert");
    expect(result.reason).toContain("Tests");
  });
});
