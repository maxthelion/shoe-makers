import { describe, test, expect } from "bun:test";
import { getHealthScore, getHealthResult } from "../skills/health-scan";

describe("health-scan", () => {
  test("getHealthScore returns null for a directory without octoclean", async () => {
    const score = await getHealthScore("/tmp/nonexistent-repo");
    expect(score).toBeNull();
  });

  test("getHealthScore returns a numeric score for the real repo", async () => {
    const score = await getHealthScore(process.cwd());
    expect(score).not.toBeNull();
    expect(typeof score).toBe("number");
    expect(score!).toBeGreaterThanOrEqual(0);
    expect(score!).toBeLessThanOrEqual(100);
  });

  test("getHealthResult returns null for a directory without octoclean", async () => {
    const result = await getHealthResult("/tmp/nonexistent-repo");
    expect(result).toBeNull();
  });

  test("getHealthResult returns score and worst files for the real repo", async () => {
    const result = await getHealthResult(process.cwd());
    expect(result).not.toBeNull();
    expect(typeof result!.score).toBe("number");
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result!.worstFiles)).toBe(true);
    expect(result!.worstFiles.length).toBeGreaterThan(0);
    expect(result!.worstFiles.length).toBeLessThanOrEqual(5);
    for (const f of result!.worstFiles) {
      expect(typeof f.path).toBe("string");
      expect(typeof f.score).toBe("number");
    }
  });
});
