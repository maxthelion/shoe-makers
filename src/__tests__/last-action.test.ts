import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { saveLastAction, readLastAction } from "../state/last-action";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-last-action-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("last-action", () => {
  test("saveLastAction writes the action to .shoe-makers/state/last-action.md", async () => {
    const action = "# Fix Tests\n\nFix the failing test suite.\n";
    await saveLastAction(tempDir, action);

    const content = await readFile(
      join(tempDir, ".shoe-makers", "state", "last-action.md"),
      "utf-8"
    );
    expect(content).toBe(action);
  });

  test("saveLastAction creates state directory if needed", async () => {
    const action = "# Implement Feature\n";
    await saveLastAction(tempDir, action);

    const content = await readFile(
      join(tempDir, ".shoe-makers", "state", "last-action.md"),
      "utf-8"
    );
    expect(content).toBe(action);
  });

  test("saveLastAction overwrites previous last-action", async () => {
    await saveLastAction(tempDir, "# First Action\n");
    await saveLastAction(tempDir, "# Second Action\n");

    const content = await readFile(
      join(tempDir, ".shoe-makers", "state", "last-action.md"),
      "utf-8"
    );
    expect(content).toBe("# Second Action\n");
  });

  test("readLastAction returns the saved action", async () => {
    const action = "# Review Work\n\nReview the diff adversarially.\n";
    await saveLastAction(tempDir, action);

    const result = await readLastAction(tempDir);
    expect(result).toBe(action);
  });

  test("readLastAction returns null when no last-action exists", async () => {
    const result = await readLastAction(tempDir);
    expect(result).toBeNull();
  });
});
