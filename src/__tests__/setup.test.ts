import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { logAssessment, readInboxMessages, formatAction, readNotes } from "../setup";
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

describe("logAssessment", () => {
  test("logs pass when tests pass", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ testsPass: true });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Tests: pass");
    logSpy.mockRestore();
  });

  test("logs FAIL when tests fail", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ testsPass: false });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Tests: FAIL");
    logSpy.mockRestore();
  });

  test("logs typecheck status when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ typecheckPass: true });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Typecheck: pass");
    logSpy.mockRestore();
  });

  test("does not log typecheck when undefined", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment();
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const typecheckLogs = logs.filter((l: string) => l.includes("Typecheck"));
    expect(typecheckLogs).toHaveLength(0);
    logSpy.mockRestore();
  });

  test("logs FAIL when typecheck fails", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ typecheckPass: false });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Typecheck: FAIL");
    logSpy.mockRestore();
  });

  test("logs skipped when typecheck is null (missing type defs)", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ typecheckPass: null });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Typecheck: skipped");
    logSpy.mockRestore();
  });

  test("logs health score when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({ healthScore: 85 });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    expect(logs).toContain("[setup] Health: 85/100");
    logSpy.mockRestore();
  });

  test("logs worst files when health < 100", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      healthScore: 75,
      worstFiles: [
        { path: "src/foo.ts", score: 40 },
        { path: "src/bar.ts", score: 55 },
      ],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const worstLine = logs.find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("src/foo.ts (40)");
    expect(worstLine).toContain("src/bar.ts (55)");
    logSpy.mockRestore();
  });

  test("does not log worst files when health is 100", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      healthScore: 100,
      worstFiles: [{ path: "src/foo.ts", score: 90 }],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const worstLine = logs.find((l: string) => l.includes("Worst files"));
    expect(worstLine).toBeUndefined();
    logSpy.mockRestore();
  });

  test("limits worst files to top 3", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      healthScore: 50,
      worstFiles: [
        { path: "a.ts", score: 10 },
        { path: "b.ts", score: 20 },
        { path: "c.ts", score: 30 },
        { path: "d.ts", score: 40 },
      ],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const worstLine = logs.find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("a.ts (10)");
    expect(worstLine).toContain("c.ts (30)");
    expect(worstLine).not.toContain("d.ts (40)");
    logSpy.mockRestore();
  });

  test("logs invariant counts when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      invariants: {
        specifiedOnly: 3,
        implementedUntested: 1,
        implementedTested: 10,
        unspecified: 2,
        topSpecGaps: [],
        topUntested: [],
        topUnspecified: [],
      },
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const invLine = logs.find((l: string) => l.includes("Invariants"));
    expect(invLine).toContain("3 specified-only");
    expect(invLine).toContain("1 untested");
    expect(invLine).toContain("2 unspecified");
    logSpy.mockRestore();
  });

  test("logs suggestions when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      invariants: {
        specifiedOnly: 5,
        implementedUntested: 0,
        implementedTested: 10,
        unspecified: 0,
        topSpecGaps: [],
        topUntested: [],
        topUnspecified: [],
      },
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c: any[]) => c[0]);
    const sugLine = logs.find((l: string) => l.includes("Suggestions"));
    expect(sugLine).toContain("5 specified-only invariants need implementation");
    logSpy.mockRestore();
  });

  test("logs uncertainties when present", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment({
      uncertainties: [
        { field: "typecheckPass", reason: "missing type definitions (bun-types)" },
        { field: "healthScore", reason: "octoclean not installed" },
      ],
    });
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c) => c[0]);
    const uncLine = logs.find((l: string) => l.includes("Uncertainties"));
    expect(uncLine).toContain("typecheckPass (missing type definitions (bun-types))");
    expect(uncLine).toContain("healthScore (octoclean not installed)");
    logSpy.mockRestore();
  });

  test("does not log uncertainties when empty or absent", () => {
    const logSpy = spyOn(console, "log");
    const assessment = makeAssessment();
    logAssessment(assessment);
    const logs = logSpy.mock.calls.map((c) => c[0]);
    const uncLine = logs.find((l: string) => l.includes("Uncertainties"));
    expect(uncLine).toBeUndefined();
    logSpy.mockRestore();
  });
});

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
