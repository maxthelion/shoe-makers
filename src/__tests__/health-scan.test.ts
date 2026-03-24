import { describe, test, expect } from "bun:test";
import { existsSync } from "fs";
import { join } from "path";
import { getHealthScore, getHealthResult, parseHealthSnapshot } from "../skills/health-scan";

const octocleanInstalled = existsSync(join(process.cwd(), "node_modules", "octoclean"));

describe("health-scan integration", () => {
  test("getHealthScore returns null for a directory without octoclean", async () => {
    const score = await getHealthScore("/tmp/nonexistent-repo");
    expect(score).toBeNull();
  });

  test.skipIf(!octocleanInstalled)("getHealthScore returns a numeric score for the real repo", async () => {
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

  test.skipIf(!octocleanInstalled)("getHealthResult returns score and worst files for the real repo", async () => {
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

describe("parseHealthSnapshot", () => {
  test("parses valid snapshot with score and files", () => {
    const snapshot = {
      summary: { health_score: 0.85 },
      files: [
        { path: "src/foo.ts", health_score: 0.4 },
        { path: "src/bar.ts", health_score: 0.9 },
      ],
    };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result).not.toBeNull();
    expect(result!.score).toBe(85);
    expect(result!.worstFiles).toHaveLength(2);
    expect(result!.worstFiles[0]).toEqual({ path: "src/foo.ts", score: 40 });
    expect(result!.worstFiles[1]).toEqual({ path: "src/bar.ts", score: 90 });
  });

  test("rounds score of 1.0 to 100", () => {
    const snapshot = { summary: { health_score: 1.0 }, files: [] };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.score).toBe(100);
  });

  test("rounds score of 0 to 0", () => {
    const snapshot = { summary: { health_score: 0 }, files: [] };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.score).toBe(0);
  });

  test("returns null when summary.health_score is missing", () => {
    const snapshot = { summary: {}, files: [] };
    expect(parseHealthSnapshot(JSON.stringify(snapshot))).toBeNull();
  });

  test("returns null when summary is missing", () => {
    const snapshot = { files: [] };
    expect(parseHealthSnapshot(JSON.stringify(snapshot))).toBeNull();
  });

  test("returns null when health_score is not a number", () => {
    const snapshot = { summary: { health_score: "good" }, files: [] };
    expect(parseHealthSnapshot(JSON.stringify(snapshot))).toBeNull();
  });

  test("returns null for malformed JSON", () => {
    expect(parseHealthSnapshot("not json")).toBeNull();
  });

  test("returns empty worstFiles when files array is empty", () => {
    const snapshot = { summary: { health_score: 0.9 }, files: [] };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.worstFiles).toEqual([]);
  });

  test("returns empty worstFiles when files is not an array", () => {
    const snapshot = { summary: { health_score: 0.9 } };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.worstFiles).toEqual([]);
  });

  test("skips files without health_score", () => {
    const snapshot = {
      summary: { health_score: 0.8 },
      files: [
        { path: "src/a.ts", health_score: 0.5 },
        { path: "src/b.ts" },
        { path: "src/c.ts", health_score: 0.7 },
      ],
    };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.worstFiles).toHaveLength(2);
  });

  test("skips files without path", () => {
    const snapshot = {
      summary: { health_score: 0.8 },
      files: [
        { health_score: 0.5 },
        { path: "src/a.ts", health_score: 0.7 },
      ],
    };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.worstFiles).toHaveLength(1);
    expect(result!.worstFiles[0].path).toBe("src/a.ts");
  });

  test("sorts files by score ascending (worst first)", () => {
    const snapshot = {
      summary: { health_score: 0.7 },
      files: [
        { path: "src/good.ts", health_score: 0.9 },
        { path: "src/bad.ts", health_score: 0.2 },
        { path: "src/ok.ts", health_score: 0.6 },
      ],
    };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.worstFiles[0].path).toBe("src/bad.ts");
    expect(result!.worstFiles[1].path).toBe("src/ok.ts");
    expect(result!.worstFiles[2].path).toBe("src/good.ts");
  });

  test("limits to top 5 worst files", () => {
    const files = Array.from({ length: 8 }, (_, i) => ({
      path: `src/file${i}.ts`,
      health_score: (i + 1) / 10,
    }));
    const snapshot = { summary: { health_score: 0.5 }, files };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.worstFiles).toHaveLength(5);
    expect(result!.worstFiles[0].path).toBe("src/file0.ts");
    expect(result!.worstFiles[4].path).toBe("src/file4.ts");
  });

  test("rounds file health scores correctly", () => {
    const snapshot = {
      summary: { health_score: 0.75 },
      files: [{ path: "src/a.ts", health_score: 0.333 }],
    };
    const result = parseHealthSnapshot(JSON.stringify(snapshot));
    expect(result!.worstFiles[0].score).toBe(33);
  });
});
