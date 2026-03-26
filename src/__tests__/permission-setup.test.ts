import { describe, test, expect } from "bun:test";
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { parseActionTypeFromPrompt } from "../prompts/helpers";
import { setupPermissionContext } from "../scheduler/permission-setup";
import { withTempDir } from "./test-utils";

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

  describe("setupPermissionContext", () => {
    test("returns undefined when skill is not critique", async () => {
      await withTempDir("perm", async (dir) => {
        const result = await setupPermissionContext(dir, "explore");
        expect(result).toBeUndefined();
      });
    });

    test("returns undefined for null skill", async () => {
      await withTempDir("perm", async (dir) => {
        const result = await setupPermissionContext(dir, null);
        expect(result).toBeUndefined();
      });
    });

    test("writes previous-action-type when last action exists", async () => {
      await withTempDir("perm", async (dir) => {
        const stateDir = join(dir, ".shoe-makers", "state");
        await mkdir(stateDir, { recursive: true });
        await writeFile(join(stateDir, "last-action.md"), "# Explore — Survey and Write Candidates\n\nSurvey.");
        await setupPermissionContext(dir, "explore");
        const prevType = await readFile(join(stateDir, "previous-action-type"), "utf-8");
        expect(prevType).toBe("explore");
      });
    });

    test("does not write previous-action-type when no last action", async () => {
      await withTempDir("perm", async (dir) => {
        await setupPermissionContext(dir, "explore");
        const stateDir = join(dir, ".shoe-makers", "state");
        let exists = true;
        try {
          await readFile(join(stateDir, "previous-action-type"), "utf-8");
        } catch {
          exists = false;
        }
        expect(exists).toBe(false);
      });
    });
  });
});
