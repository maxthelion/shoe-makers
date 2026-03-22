import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { prioritise } from "../skills/prioritise";
import { writeAssessment } from "../state/blackboard";
import type { Assessment } from "../types";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-prioritise-test-"));
  await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function makeAssessment(overrides: Partial<Assessment> = {}): Assessment {
  return {
    timestamp: new Date().toISOString(),
    invariants: null,
    healthScore: null,
    worstFiles: [],
    openPlans: [],
    findings: [],
    testsPass: true,
    recentGitActivity: [],
    ...overrides,
  };
}

describe("prioritise", () => {
  test("throws when no assessment exists", async () => {
    await expect(prioritise(tempDir)).rejects.toThrow("Cannot prioritise without an assessment");
  });

  test("returns empty priority list when assessment has no actionable items", async () => {
    await writeAssessment(tempDir, makeAssessment());

    const result = await prioritise(tempDir);
    expect(result.items).toEqual([]);
    expect(result.assessedAt).toBeTruthy();
  });

  test("generates fix-tests priority when tests fail", async () => {
    await writeAssessment(tempDir, makeAssessment({ testsPass: false }));

    const result = await prioritise(tempDir);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].type).toBe("fix");
    expect(result.items[0].description).toContain("failing tests");
  });

  test("generates implement priority for open plans", async () => {
    await writeAssessment(tempDir, makeAssessment({ openPlans: ["feature-x", "feature-y"] }));

    const result = await prioritise(tempDir);
    expect(result.items.length).toBe(2);
    expect(result.items.every((i) => i.type === "implement")).toBe(true);
    expect(result.items[0].description).toContain("feature-x");
  });

  test("generates test priority for untested invariants", async () => {
    await writeAssessment(
      tempDir,
      makeAssessment({
        invariants: {
          specifiedOnly: 0,
          implementedUntested: 3,
          implementedTested: 5,
          unspecified: 0,
          topSpecGaps: [],
          topUntested: [
            { id: "tree.evaluate.selector", description: "Selector returns first success", group: "tree" },
          ],
          topUnspecified: [],
        },
      })
    );

    const result = await prioritise(tempDir);
    expect(result.items.some((i) => i.type === "test")).toBe(true);
  });

  test("generates implement priority for spec gaps", async () => {
    await writeAssessment(
      tempDir,
      makeAssessment({
        invariants: {
          specifiedOnly: 2,
          implementedUntested: 0,
          implementedTested: 5,
          unspecified: 0,
          topSpecGaps: [
            { id: "scheduler.tick-loop", description: "Tick loop runs every 5 minutes", group: "scheduler" },
          ],
          topUntested: [],
          topUnspecified: [],
        },
      })
    );

    const result = await prioritise(tempDir);
    expect(result.items.some((i) => i.type === "implement")).toBe(true);
    expect(result.items.some((i) => i.description.includes("Tick loop"))).toBe(true);
  });

  test("generates candidates from findings", async () => {
    await writeAssessment(
      tempDir,
      makeAssessment({
        findings: [
          { id: "wiki-outdated", content: "# Wiki Outdated\n\nThe wiki says X but code does Y." },
          { id: "test-gap", content: "# Test Gap\n\nScheduler has no tests." },
        ],
      })
    );

    const result = await prioritise(tempDir);
    expect(result.items.length).toBe(2);
    expect(result.items.some((i) => i.description.includes("wiki-outdated"))).toBe(true);
    expect(result.items.some((i) => i.description.includes("test-gap"))).toBe(true);
  });

  test("includes finding content in task prompt", async () => {
    await writeAssessment(
      tempDir,
      makeAssessment({
        findings: [{ id: "my-finding", content: "# Important\n\nDetails here." }],
      })
    );

    const result = await prioritise(tempDir);
    expect(result.items[0].taskPrompt).toContain("Details here");
  });

  test("generates health priority when score is low", async () => {
    await writeAssessment(tempDir, makeAssessment({ healthScore: 45 }));

    const result = await prioritise(tempDir);
    expect(result.items.some((i) => i.type === "health")).toBe(true);
  });

  test("does not generate health priority when score is acceptable", async () => {
    await writeAssessment(tempDir, makeAssessment({ healthScore: 85 }));

    const result = await prioritise(tempDir);
    expect(result.items.every((i) => i.type !== "health")).toBe(true);
  });

  test("ranks fix-tests above everything else", async () => {
    await writeAssessment(
      tempDir,
      makeAssessment({
        testsPass: false,
        openPlans: ["some-plan"],
        healthScore: 30,
      })
    );

    const result = await prioritise(tempDir);
    expect(result.items[0].type).toBe("fix");
    expect(result.items[0].rank).toBe(1);
  });

  test("assigns sequential rank numbers", async () => {
    await writeAssessment(
      tempDir,
      makeAssessment({
        testsPass: false,
        openPlans: ["plan-a"],
        healthScore: 50,
      })
    );

    const result = await prioritise(tempDir);
    const ranks = result.items.map((i) => i.rank);
    expect(ranks).toEqual(ranks.map((_, i) => i + 1));
  });

  test("writes priorities.json to disk", async () => {
    await writeAssessment(tempDir, makeAssessment({ openPlans: ["plan-a"] }));
    await prioritise(tempDir);

    const content = await readFile(
      join(tempDir, ".shoe-makers", "state", "priorities.json"),
      "utf-8"
    );
    const parsed = JSON.parse(content);
    expect(parsed.items.length).toBe(1);
    expect(parsed.assessedAt).toBeTruthy();
  });

  test("sets assessedAt to the assessment timestamp", async () => {
    const assessment = makeAssessment();
    await writeAssessment(tempDir, assessment);

    const result = await prioritise(tempDir);
    expect(result.assessedAt).toBe(assessment.timestamp);
  });
});
