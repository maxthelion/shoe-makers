import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { parseClaimEvidenceYaml, loadClaimEvidence } from "../verify/parse-evidence";

describe("parseClaimEvidenceYaml", () => {
  test("parses a basic claim with source and test evidence", () => {
    const yaml = [
      "architecture.pure-functions:",
      "  source:",
      "    - [evaluate, TreeNode]",
      "  test:",
      "    - [evaluate.test, tree]",
    ].join("\n");
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["architecture.pure-functions"]).toBeDefined();
    expect(result["architecture.pure-functions"].sourceEvidence).toEqual([["evaluate", "TreeNode"]]);
    expect(result["architecture.pure-functions"].testEvidence).toEqual([["evaluate.test", "tree"]]);
  });

  test("parses multiple claims", () => {
    const yaml = [
      "first.claim:",
      "  source:",
      "    - [pattern1]",
      "second.claim:",
      "  source:",
      "    - [pattern2]",
    ].join("\n");
    const result = parseClaimEvidenceYaml(yaml);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["first.claim"].sourceEvidence).toEqual([["pattern1"]]);
    expect(result["second.claim"].sourceEvidence).toEqual([["pattern2"]]);
  });

  test("handles multiple evidence groups (AND-of-OR)", () => {
    const yaml = [
      "claim.id:",
      "  source:",
      "    - [patternA, patternB]",
      "    - [patternC]",
    ].join("\n");
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toHaveLength(2);
    expect(result["claim.id"].sourceEvidence[0]).toEqual(["patternA", "patternB"]);
    expect(result["claim.id"].sourceEvidence[1]).toEqual(["patternC"]);
  });

  test("returns empty evidence arrays when only claim ID present", () => {
    const yaml = "claim.id:\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"]).toEqual({ sourceEvidence: [], testEvidence: [] });
  });

  test("skips comment lines", () => {
    const yaml = [
      "# This is a comment",
      "claim.id:",
      "  source:",
      "    # Another comment",
      "    - [pattern]",
    ].join("\n");
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toEqual([["pattern"]]);
  });

  test("skips empty lines", () => {
    const yaml = [
      "claim.id:",
      "",
      "  source:",
      "",
      "    - [pattern]",
    ].join("\n");
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toEqual([["pattern"]]);
  });

  test("returns empty record for empty string", () => {
    expect(parseClaimEvidenceYaml("")).toEqual({});
  });

  test("handles quoted patterns with single quotes", () => {
    const yaml = "claim.id:\n  source:\n    - ['hello world', 'foo bar']\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toEqual([["hello world", "foo bar"]]);
  });

  test("handles quoted patterns with double quotes", () => {
    const yaml = 'claim.id:\n  source:\n    - ["hello world", "foo bar"]\n';
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toEqual([["hello world", "foo bar"]]);
  });

  test("handles escaped characters in quoted strings", () => {
    const yaml = 'claim.id:\n  source:\n    - ["hello\\"world"]\n';
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toEqual([['hello"world']]);
  });

  test("handles claim IDs with dots and parentheses", () => {
    const yaml = "spec.core-functionality.runs-overnight():\n  source:\n    - [schedule]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["spec.core-functionality.runs-overnight()"]).toBeDefined();
  });

  test("handles claims with only source evidence", () => {
    const yaml = "claim.id:\n  source:\n    - [pattern]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toEqual([["pattern"]]);
    expect(result["claim.id"].testEvidence).toEqual([]);
  });

  test("handles claims with only test evidence", () => {
    const yaml = "claim.id:\n  test:\n    - [test-pattern]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["claim.id"].sourceEvidence).toEqual([]);
    expect(result["claim.id"].testEvidence).toEqual([["test-pattern"]]);
  });
});

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-evidence-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

describe("loadClaimEvidence", () => {
  test("returns empty record when file does not exist", async () => {
    const result = await loadClaimEvidence(tempDir);
    expect(result).toEqual({});
  });

  test("loads and parses YAML from repo root", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers/claim-evidence.yaml"),
      "test.claim:\n  source:\n    - [pattern]\n"
    );
    const result = await loadClaimEvidence(tempDir);
    expect(result["test.claim"]).toBeDefined();
    expect(result["test.claim"].sourceEvidence).toEqual([["pattern"]]);
  });
});
