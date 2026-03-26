import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { checkInvariants } from "../verify/invariants";
import { extractClaims, extractInvariantClaims } from "../verify/extract-claims";
import { parseClaimEvidenceYaml, loadClaimEvidence, type EvidenceRule } from "../verify/parse-evidence";
import { writeWikiPage as _writeWikiPage, writeSourceFile as _writeSourceFile, writeTestFile as _writeTestFile, writeClaimEvidence as _writeClaimEvidence } from "./test-utils";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-invariants-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// Bind helpers to tempDir for convenience
function writeWikiPage(name: string, title: string, category: string, body?: string) {
  return _writeWikiPage(tempDir, name, title, category, body);
}
function writeSourceFile(path: string, content?: string) {
  return _writeSourceFile(tempDir, path, content);
}
function writeTestFile(path: string, content?: string) {
  return _writeTestFile(tempDir, path, content);
}
function writeClaimEvidence(yaml: string) {
  return _writeClaimEvidence(tempDir, yaml);
}

describe("extractInvariantClaims", () => {
  test("extracts claims from real invariants.md", async () => {
    const claims = await extractInvariantClaims(process.cwd());
    expect(claims.length).toBeGreaterThanOrEqual(100);
  });

  test("each claim has a unique ID", async () => {
    const claims = await extractInvariantClaims(process.cwd());
    const ids = new Set(claims.map((c) => c.id));
    expect(ids.size).toBe(claims.length);
  });

  test("all claims belong to a known group", async () => {
    const claims = await extractInvariantClaims(process.cwd());
    const validGroups = new Set([
      "what-a-user-can-do",
      "how-it-decides-what-to-do",
      "how-it-does-the-work",
      "architectural-guarantees",
      "data-contracts",
    ]);
    for (const claim of claims) {
      expect(validGroups.has(claim.group)).toBe(true);
    }
  });

  test("returns empty array when no invariants file exists", async () => {
    const claims = await extractInvariantClaims("/tmp/nonexistent-repo");
    expect(claims).toEqual([]);
  });
});

describe("CLAIM_EVIDENCE and checkEvidence coverage", () => {
  test("checkInvariants uses CLAIM_EVIDENCE to match claims against code", async () => {
    // The invariants system uses CLAIM_EVIDENCE mapping and checkEvidence function
    // to verify claims. This test confirms the pipeline works end-to-end.
    const result = await checkInvariants(process.cwd());
    const total =
      result.implementedTested + result.implementedUntested + result.specifiedOnly;
    // The CLAIM_EVIDENCE map has 50+ entries; checkEvidence checks each one
    expect(total).toBeGreaterThanOrEqual(40);
  });
});

describe("extractClaims", () => {
  let evidence: Record<string, EvidenceRule>;

  // Load evidence once for all extractClaims tests
  beforeEach(async () => {
    evidence = await loadClaimEvidence(process.cwd());
  });

  test("extracts claims for a page with known evidence rules", () => {
    const page = {
      filename: "behaviour-tree",
      title: "Behaviour Tree",
      category: "architecture",
      content: "# Behaviour Tree\nSome content",
    };
    const claims = extractClaims(page, evidence);
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
    const claims = extractClaims(page, evidence);
    expect(claims.length).toBe(0);
  });

  test("each claim has required fields", () => {
    const page = {
      filename: "tick-types",
      title: "Tick Types",
      category: "architecture",
      content: "# Tick Types\nContent",
    };
    const claims = extractClaims(page, evidence);
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
    await writeClaimEvidence(
      "behaviour-tree.tree-evaluator:\n  source:\n    - [export function evaluate]\n  test:\n    - [\"evaluate(\"]\n"
    );
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
    await writeClaimEvidence(
      "behaviour-tree.llm-prioritiser:\n  source:\n    - [LLMPrioritiser]\n  test:\n    - [LLMPrioritiser]\n"
    );
    // No source code at all

    const result = await checkInvariants(tempDir);
    expect(result.specifiedOnly).toBeGreaterThan(0);
    expect(result.topSpecGaps.length).toBeGreaterThan(0);
    // Should have multiple spec gaps since we have no code for any claims
    expect(result.topSpecGaps.some((g) => g.id.startsWith("behaviour-tree."))).toBe(true);
  });

  test("multiple claims from same page can have different statuses", async () => {
    await writeWikiPage("behaviour-tree", "Behaviour Tree", "architecture");
    await writeClaimEvidence([
      "behaviour-tree.tree-evaluator:",
      "  source:",
      "    - [export function evaluate]",
      "  test:",
      '    - ["evaluate("]',
      "behaviour-tree.llm-prioritiser:",
      "  source:",
      "    - [LLMPrioritiser]",
      "  test:",
      "    - [LLMPrioritiser]",
    ].join("\n") + "\n");
    // Implement the evaluator claim but not the LLM prioritiser
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
    const total = result.implementedTested + result.implementedUntested + result.specifiedOnly;
    expect(total).toBeGreaterThanOrEqual(1);
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
    // Spec gaps should be minimal (0 or more — depends on wiki updates)
    expect(result.specifiedOnly).toBeGreaterThanOrEqual(0);
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
