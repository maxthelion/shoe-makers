import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { readInboxMessages, formatAction, readNotes } from "../setup";
import type { WorldState, Config, Assessment } from "../types";
import { makeAssessment as makeSharedAssessment, makeState, emptyBlackboard } from "./test-utils";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-setup-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

function makeAssessment(overrides: Partial<Assessment> = {}): Assessment {
  return makeSharedAssessment({ invariants: null, healthScore: null, ...overrides });
}

function makeWorldState(overrides: Partial<WorldState> = {}): WorldState {
  const config: Config = {
    branchPrefix: "shoemakers",
    tickInterval: 5,
    wikiDir: "wiki",
    assessmentStaleAfter: 30,
    maxTicksPerShift: 10,
    enabledSkills: null,
    insightFrequency: 0.3,
    maxInnovationCycles: 3,
  };
  return makeState({
    branch: "shoemakers/2026-03-22",
    blackboard: { ...emptyBlackboard(), assessment: null },
    config,
    ...overrides,
  });
}

describe("readInboxMessages", () => {
  test("returns empty array when inbox dir does not exist", async () => {
    const messages = await readInboxMessages(tempDir);
    expect(messages).toEqual([]);
  });

  test("returns empty array when inbox dir is empty", async () => {
    await mkdir(join(tempDir, ".shoe-makers", "inbox"), { recursive: true });
    const messages = await readInboxMessages(tempDir);
    expect(messages).toEqual([]);
  });

  test("reads .md files from inbox", async () => {
    const inboxDir = join(tempDir, ".shoe-makers", "inbox");
    await mkdir(inboxDir, { recursive: true });
    await writeFile(join(inboxDir, "msg1.md"), "Hello elf!");
    await writeFile(join(inboxDir, "msg2.md"), "Fix this bug");
    const messages = await readInboxMessages(tempDir);
    expect(messages).toHaveLength(2);
    const contents = messages.map((m) => m.content);
    expect(contents).toContain("Hello elf!");
    expect(contents).toContain("Fix this bug");
  });

  test("ignores non-.md files", async () => {
    const inboxDir = join(tempDir, ".shoe-makers", "inbox");
    await mkdir(inboxDir, { recursive: true });
    await writeFile(join(inboxDir, "msg.md"), "valid");
    await writeFile(join(inboxDir, "notes.txt"), "ignored");
    await writeFile(join(inboxDir, "data.json"), "{}");
    const messages = await readInboxMessages(tempDir);
    expect(messages).toHaveLength(1);
    expect(messages[0].file).toBe("msg.md");
  });
});

describe("formatAction", () => {
  test("returns nothing-to-do when skill is null", () => {
    const state = makeWorldState();
    const result = formatAction(null, state, []);
    expect(result).toContain("Nothing to Do");
  });

  test("formats inbox messages when skill is inbox", () => {
    const state = makeWorldState({ inboxCount: 2 });
    const messages = [
      { file: "msg1.md", content: "Fix bug #42" },
      { file: "msg2.md", content: "Update docs" },
    ];
    const result = formatAction("inbox", state, messages);
    expect(result).toContain("Inbox Messages");
    expect(result).toContain("2 message(s)");
    expect(result).toContain("Fix bug #42");
    expect(result).toContain("Update docs");
    expect(result).toContain("msg1.md");
    expect(result).toContain("msg2.md");
  });

  test("falls through to generatePrompt when skill is inbox but no messages", () => {
    const state = makeWorldState();
    const result = formatAction("inbox", state, []);
    // With no messages, it falls to generatePrompt("inbox", ...) instead of the inline inbox handler
    expect(result).not.toContain("Act on These First");
    expect(result).toContain("After completing");
  });

  test("includes 'After exploring' suffix for explore skill", () => {
    const state = makeWorldState();
    const result = formatAction("explore", state, []);
    expect(result).toContain("After exploring");
  });

  test("includes 'After completing' suffix for non-explore skills", () => {
    const state = makeWorldState();
    const result = formatAction("fix-tests", state, []);
    expect(result).toContain("After completing");
  });

  test("includes run setup instruction", () => {
    const state = makeWorldState();
    const result = formatAction("explore", state, []);
    expect(result).toContain("bun run setup");
  });
});

describe("readNotes", () => {
  test("returns empty string when no notes exist", async () => {
    const result = await readNotes(tempDir);
    expect(result).toBe("");
  });

  test("reads note files and formats them as bullet list", async () => {
    const findingsDir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(findingsDir, { recursive: true });
    await writeFile(
      join(findingsDir, "note-2026-03-26-001.md"),
      "# Note\n\nThe health score for prompts.test.ts has been stuck at 87.\n"
    );

    const result = await readNotes(tempDir);
    expect(result).toContain("Notes from previous elves");
    expect(result).toContain("- The health score for prompts.test.ts has been stuck at 87.");
  });

  test("reads multiple notes", async () => {
    const findingsDir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(findingsDir, { recursive: true });
    await writeFile(
      join(findingsDir, "note-2026-03-26-001.md"),
      "# Note\n\nFirst observation.\n"
    );
    await writeFile(
      join(findingsDir, "note-2026-03-26-002.md"),
      "# Note\n\nSecond observation.\n"
    );

    const result = await readNotes(tempDir);
    expect(result).toContain("- First observation.");
    expect(result).toContain("- Second observation.");
  });

  test("ignores non-note findings", async () => {
    const findingsDir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(findingsDir, { recursive: true });
    await writeFile(
      join(findingsDir, "critique-2026-03-26-001.md"),
      "# Critique\n\nSome critique content.\n"
    );

    const result = await readNotes(tempDir);
    expect(result).toBe("");
  });

  test("skips notes with empty body", async () => {
    const findingsDir = join(tempDir, ".shoe-makers", "findings");
    await mkdir(findingsDir, { recursive: true });
    await writeFile(
      join(findingsDir, "note-2026-03-26-001.md"),
      "# Note\n\n"
    );

    const result = await readNotes(tempDir);
    expect(result).toBe("");
  });
});

describe("formatAction includes elf notes", () => {
  test("includes notes in action prompt when provided", () => {
    const state = makeWorldState();
    const notes = "\n\n## Notes from previous elves\n\n- Test observation.\n";
    const result = formatAction("explore", state, [], undefined, undefined, undefined, undefined, undefined, notes);
    expect(result).toContain("Notes from previous elves");
    expect(result).toContain("Test observation.");
  });

  test("omits notes section when no notes", () => {
    const state = makeWorldState();
    const result = formatAction("explore", state, []);
    expect(result).not.toContain("Notes from previous elves");
  });
});

describe("innovate observability — setup logs Wikipedia article fetched", () => {
  test("setup.ts source contains shift log entry for Wikipedia article fetched", async () => {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    // The log entries live in the wikipedia module which setup.ts calls
    const wikiSource = await readFile(join(process.cwd(), "src", "creative", "wikipedia.ts"), "utf-8");
    expect(wikiSource).toContain("Wikipedia article fetched");
    expect(wikiSource).toContain("Wikipedia article");
    expect(wikiSource).toContain("fetch failed");
    // setup.ts wires the shift log callback to fetchArticleForAction
    const setupSource = await readFile(join(process.cwd(), "src", "setup.ts"), "utf-8");
    expect(setupSource).toContain("appendToShiftLog");
    expect(setupSource).toContain("fetchArticleForAction");
  });
});
