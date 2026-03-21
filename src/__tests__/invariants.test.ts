import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { checkInvariants, extractClaims } from "../verify/invariants";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-invariants-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function writeWikiPage(
  name: string,
  title: string,
  category: string,
  body: string = ""
): Promise<void> {
  const dir = join(tempDir, "wiki", "pages");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${name}.md`),
    `---\ntitle: ${title}\ncategory: ${category}\n---\n# ${title}\n${body}`
  );
}

async function writeSourceFile(path: string, content: string = "// source\n"): Promise<void> {
  const fullPath = join(tempDir, "src", path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content);
}

async function writeTestFile(path: string, content: string = "// test\n"): Promise<void> {
  const fullPath = join(tempDir, "src", path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content);
}

describe("extractClaims", () => {
  test("extracts claims for a page with known evidence rules", () => {
    const page = {
      filename: "behaviour-tree",
      title: "Behaviour Tree",
      category: "architecture",
      content: "# Behaviour Tree\nSome content",
    };
    const claims = extractClaims(page);
    expect(claims.length).toBeGreaterThan(3);
    expect(claims.every((c) => c.page === "behaviour-tree")).toBe(true);
    expect(claims.every((c) => c.id.startsWith("behaviour-tree."))).toBe(true);
  });

  test("returns empty array for pages with no evidence rules", () => {
    const page = {
      filename: "unknown-page",
      title: "Unknown",
      category: "architecture",
      content: "# Unknown\nSome content",
    };
    const claims = extractClaims(page);
    expect(claims.length).toBe(0);
  });

  test("each claim has required fields", () => {
    const page = {
      filename: "tick-types",
      title: "Tick Types",
      category: "architecture",
      content: "# Tick Types\nContent",
    };
    const claims = extractClaims(page);
    for (const claim of claims) {
      expect(claim.id).toBeTruthy();
      expect(claim.text).toBeTruthy();
      expect(claim.page).toBe("tick-types");
      expect(claim.group).toBe("architecture");
    }
  });
});

describe("checkInvariants", () => {
  test("returns zeros when no wiki or source exists", async () => {
    const result = await checkInvariants(tempDir);
    expect(result.specifiedOnly).toBe(0);
    expect(result.implementedUntested).toBe(0);
    expect(result.implementedTested).toBe(0);
    expect(result.unspecified).toBe(0);
  });

  test("detects implemented-and-tested claim", async () => {
    await writeWikiPage("behaviour-tree", "Behaviour Tree", "architecture");
    // Write source with patterns that match the "tree-evaluator" claim
    await writeSourceFile(
      "tree/evaluate.ts",
      'export function evaluate(node: any) { return "success"; }'
    );
    await writeTestFile(
      "__tests__/evaluate.test.ts",
      'test("evaluate works", () => { evaluate({}) });'
    );

    const result = await checkInvariants(tempDir);
    expect(result.implementedTested).toBeGreaterThanOrEqual(1);
  });

  test("detects specified-only claim when no matching code exists", async () => {
    // behaviour-tree page has claims like "llm-prioritiser" that require LLM code
    await writeWikiPage("behaviour-tree", "Behaviour Tree", "architecture");
    // No source code at all

    const result = await checkInvariants(tempDir);
    expect(result.specifiedOnly).toBeGreaterThan(0);
    expect(result.topSpecGaps.length).toBeGreaterThan(0);
    // Should have multiple spec gaps since we have no code for any claims
    expect(result.topSpecGaps.some((g) => g.id.startsWith("behaviour-tree."))).toBe(true);
  });

  test("multiple claims from same page can have different statuses", async () => {
    await writeWikiPage("behaviour-tree", "Behaviour Tree", "architecture");
    // Implement the evaluator but not the LLM prioritiser
    await writeSourceFile(
      "tree/evaluate.ts",
      'export function evaluate(node: any) { return "success"; }'
    );
    await writeSourceFile(
      "tree/default-tree.ts",
      'export function isAssessmentStale() { return true; }\nexport function isPrioritisationStale() { return true; }'
    );
    await writeSourceFile(
      "state/blackboard.ts",
      'export function readBlackboard() { return {}; }\nexport function writeAssessment() {}'
    );
    await writeSourceFile(
      "skills/prioritise.ts",
      'export function rankCandidates(c: any[]) { return c; }'
    );
    await writeSourceFile(
      "scheduler/tick.ts",
      'function tick() { evaluate(defaultTree, state); }'
    );
    await writeTestFile(
      "__tests__/evaluate.test.ts",
      'test("evaluate works", () => { evaluate({}) });'
    );

    const result = await checkInvariants(tempDir);
    // Some claims should be implemented (evaluate exists with tests)
    expect(result.implementedTested).toBeGreaterThanOrEqual(1);
    // LLM prioritiser should be specified-only (no LLM code exists)
    expect(result.specifiedOnly).toBeGreaterThanOrEqual(1);
    const llmGap = result.topSpecGaps.find((g) => g.id === "behaviour-tree.llm-prioritiser");
    expect(llmGap).toBeTruthy();
  });

  test("ignores plan pages", async () => {
    await writeWikiPage("feature-plan", "Feature Plan", "plan");

    const result = await checkInvariants(tempDir);
    expect(result.specifiedOnly).toBe(0);
    expect(result.implementedTested).toBe(0);
  });

  test("detects unspecified code directories", async () => {
    // Source dir with no wiki page mapping
    await writeSourceFile("unknown-module/thing.ts", "export function foo() {}");

    const result = await checkInvariants(tempDir);
    expect(result.unspecified).toBeGreaterThanOrEqual(1);
    expect(result.topUnspecified.some((u) => u.id === "code.unknown-module")).toBe(true);
  });

  test("reports on real repo — finds both implemented and gaps", async () => {
    const result = await checkInvariants(process.cwd());
    // Should find many implemented-tested claims
    expect(result.implementedTested).toBeGreaterThanOrEqual(5);
    // Should find some spec gaps (LLM features, adversarial review, etc.)
    expect(result.specifiedOnly).toBeGreaterThanOrEqual(1);
    // Total claims checked should be much more than 10 (old coarse mapping had ~10)
    const total = result.implementedTested + result.implementedUntested + result.specifiedOnly;
    expect(total).toBeGreaterThanOrEqual(15);
  });

  test("spec gaps include actionable descriptions", async () => {
    const result = await checkInvariants(process.cwd());
    for (const gap of result.topSpecGaps) {
      expect(gap.id).toMatch(/\./); // dotted path like "page.claim"
      expect(gap.description.length).toBeGreaterThan(0);
      expect(gap.group).toBeTruthy();
    }
  });
});
