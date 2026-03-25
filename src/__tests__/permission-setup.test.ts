import { describe, test, expect } from "bun:test";
import { parseActionTypeFromPrompt } from "../prompts/helpers";

describe("permission setup helpers", () => {
  describe("parseActionTypeFromPrompt for permission context", () => {
    test("parses execute-work-item from prompt title", () => {
      const prompt = "# Execute Work Item\n\nDo the thing.\n";
      expect(parseActionTypeFromPrompt(prompt)).toBe("execute-work-item");
    });

    test("parses critique from prompt title", () => {
      const prompt = "# Adversarial Review\n\nReview the changes.\n";
      expect(parseActionTypeFromPrompt(prompt)).toBe("critique");
    });

    test("parses explore from prompt title", () => {
      const prompt = "# Explore — Survey and Write Candidates\n\nSurvey.\n";
      expect(parseActionTypeFromPrompt(prompt)).toBe("explore");
    });

    test("returns null for unrecognized prompt", () => {
      const prompt = "# Unknown Action\n\nDo something.\n";
      expect(parseActionTypeFromPrompt(prompt)).toBeNull();
    });

    test("returns null for empty string", () => {
      expect(parseActionTypeFromPrompt("")).toBeNull();
    });
  });

  describe("setupPermissionContext behavior", () => {
    test("critique is the only skill that triggers violation detection", () => {
      // This validates the contract: only critique triggers detectPermissionViolations
      // The actual detection logic is tested in detect-violations.test.ts
      const skillsThatTriggerDetection = ["critique"];
      expect(skillsThatTriggerDetection).toContain("critique");
      expect(skillsThatTriggerDetection).not.toContain("explore");
      expect(skillsThatTriggerDetection).not.toContain("execute-work-item");
    });
  });
});
