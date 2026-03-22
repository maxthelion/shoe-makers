import { describe, test, expect } from "bun:test";
import { checkHealthRegression } from "../verify/health-regression";

describe("checkHealthRegression", () => {
  test("returns null when health improved", () => {
    const result = checkHealthRegression(70, 80);
    expect(result).toBeNull();
  });

  test("returns null when health stayed the same", () => {
    const result = checkHealthRegression(70, 70);
    expect(result).toBeNull();
  });

  test("returns issue when health regressed", () => {
    const result = checkHealthRegression(80, 70);
    expect(result).not.toBeNull();
    expect(result).toContain("regress");
    expect(result).toContain("80");
    expect(result).toContain("70");
  });

  test("returns null when before score is null (no baseline)", () => {
    const result = checkHealthRegression(null, 70);
    expect(result).toBeNull();
  });

  test("returns null when after score is null (scan unavailable)", () => {
    const result = checkHealthRegression(80, null);
    expect(result).toBeNull();
  });

  test("returns null when both scores are null", () => {
    const result = checkHealthRegression(null, null);
    expect(result).toBeNull();
  });

  test("tolerates small regressions within threshold", () => {
    // A 1-point drop could be noise
    const result = checkHealthRegression(80, 79);
    expect(result).toBeNull();
  });

  test("flags regression beyond threshold", () => {
    // A 3+ point drop is significant
    const result = checkHealthRegression(80, 77);
    expect(result).not.toBeNull();
  });
});
