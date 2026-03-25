import { describe, test, expect } from "bun:test";
import { parseClaimEvidenceYaml } from "../verify/parse-evidence";
import type { AgentResult } from "../types";

describe("AgentResult type contract", () => {
  test("AgentResult has required fields", () => {
    const result: AgentResult = {
      status: "done",
      filesChanged: ["src/foo.ts"],
      log: "Did the thing",
    };
    expect(result.status).toBe("done");
    expect(result.filesChanged).toHaveLength(1);
    expect(result.log).toBeTruthy();
  });

  test("AgentResult supports all statuses", () => {
    const statuses: AgentResult["status"][] = ["done", "partial", "failed"];
    for (const status of statuses) {
      const result: AgentResult = { status, filesChanged: [], log: "" };
      expect(result.status).toBe(status);
    }
  });
});

describe("parseClaimEvidenceYaml", () => {
  test("parses basic claim with source and test evidence", () => {
    const yaml = "my-claim:\n  source:\n    - [pattern1, pattern2]\n  test:\n    - [test1]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["my-claim"]).toBeDefined();
    expect(result["my-claim"].sourceEvidence).toEqual([["pattern1", "pattern2"]]);
    expect(result["my-claim"].testEvidence).toEqual([["test1"]]);
  });

  test("parses multiple claims", () => {
    const yaml = "claim-a:\n  source:\n    - [a]\n  test:\n    - [b]\n\nclaim-b:\n  source:\n    - [c]\n  test:\n    - [d]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["claim-a"]).toBeDefined();
    expect(result["claim-b"]).toBeDefined();
  });

  test("parses multiple evidence groups (AND-of-OR)", () => {
    const yaml = "my-claim:\n  source:\n    - [a, b]\n    - [c]\n  test:\n    - [x]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["my-claim"].sourceEvidence).toEqual([["a", "b"], ["c"]]);
  });

  test("handles quoted strings with commas", () => {
    const yaml = 'my-claim:\n  source:\n    - ["hello, world"]\n  test:\n    - [x]\n';
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["my-claim"].sourceEvidence).toEqual([["hello, world"]]);
  });

  test("handles dotted claim IDs", () => {
    const yaml = "spec.set-up-and-go.my-feature:\n  source:\n    - [pattern]\n  test:\n    - [test]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["spec.set-up-and-go.my-feature"]).toBeDefined();
  });

  test("skips comment lines", () => {
    const yaml = "# This is a comment\nmy-claim:\n  source:\n    - [a]\n  test:\n    - [b]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(Object.keys(result)).toHaveLength(1);
  });

  test("returns empty object for empty input", () => {
    const result = parseClaimEvidenceYaml("");
    expect(Object.keys(result)).toHaveLength(0);
  });

  test("handles claim with parentheses in ID", () => {
    const yaml = "spec.tree-conditions-(priority).test-claim:\n  source:\n    - [a]\n  test:\n    - [b]\n";
    const result = parseClaimEvidenceYaml(yaml);
    expect(result["spec.tree-conditions-(priority).test-claim"]).toBeDefined();
  });
});
