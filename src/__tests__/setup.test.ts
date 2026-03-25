import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { logAssessment, readInboxMessages, formatAction } from "../setup";
import type { WorldState, Config, Assessment } from "../types";
import { makeState, emptyBlackboard } from "./test-utils";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-setup-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

/** Assessment factory with null defaults (matching setup.test expectations) */
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

const defaultConfig: Config = {
  branchPrefix: "shoemakers",
  tickInterval: 5,
  wikiDir: "wiki",
  assessmentStaleAfter: 30,
  maxTicksPerShift: 10,
  enabledSkills: null,
  insightFrequency: 0.3,
  maxInnovationCycles: 3,
};

function makeWorldState(overrides: Partial<WorldState> = {}): WorldState {
  return makeState({
    blackboard: { ...emptyBlackboard() },
    config: defaultConfig,
    ...overrides,
  });
}

function withLogSpy(fn: (logs: () => string[]) => void): void {
  const logSpy = spyOn(console, "log");
  try {
    fn(() => logSpy.mock.calls.map((c: any[]) => c[0]));
  } finally {
    logSpy.mockRestore();
  }
}

describe("logAssessment", () => {
  test("logs pass when tests pass", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ testsPass: true }));
    expect(logs()).toContain("[setup] Tests: pass");
  }));

  test("logs FAIL when tests fail", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ testsPass: false }));
    expect(logs()).toContain("[setup] Tests: FAIL");
  }));

  test("logs typecheck status when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ typecheckPass: true }));
    expect(logs()).toContain("[setup] Typecheck: pass");
  }));

  test("does not log typecheck when undefined", () => withLogSpy((logs) => {
    logAssessment(makeAssessment());
    expect(logs().filter((l: string) => l.includes("Typecheck"))).toHaveLength(0);
  }));

  test("logs FAIL when typecheck fails", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ typecheckPass: false }));
    expect(logs()).toContain("[setup] Typecheck: FAIL");
  }));

  test("logs skipped when typecheck is null (missing type defs)", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ typecheckPass: null }));
    expect(logs()).toContain("[setup] Typecheck: skipped");
  }));

  test("logs health score when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({ healthScore: 85 }));
    expect(logs()).toContain("[setup] Health: 85/100");
  }));

  test("logs worst files when health < 100", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      healthScore: 75,
      worstFiles: [
        { path: "src/foo.ts", score: 40 },
        { path: "src/bar.ts", score: 55 },
      ],
    }));
    const worstLine = logs().find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("src/foo.ts (40)");
    expect(worstLine).toContain("src/bar.ts (55)");
  }));

  test("does not log worst files when health is 100", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      healthScore: 100,
      worstFiles: [{ path: "src/foo.ts", score: 90 }],
    }));
    expect(logs().find((l: string) => l.includes("Worst files"))).toBeUndefined();
  }));

  test("limits worst files to top 3", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      healthScore: 50,
      worstFiles: [
        { path: "a.ts", score: 10 },
        { path: "b.ts", score: 20 },
        { path: "c.ts", score: 30 },
        { path: "d.ts", score: 40 },
      ],
    }));
    const worstLine = logs().find((l: string) => l.includes("Worst files"));
    expect(worstLine).toContain("a.ts (10)");
    expect(worstLine).toContain("c.ts (30)");
    expect(worstLine).not.toContain("d.ts (40)");
  }));

  test("logs invariant counts when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      invariants: {
        specifiedOnly: 3, implementedUntested: 1, implementedTested: 10,
        unspecified: 2, topSpecGaps: [], topUntested: [], topUnspecified: [],
      },
    }));
    const invLine = logs().find((l: string) => l.includes("Invariants"));
    expect(invLine).toContain("3 specified-only");
    expect(invLine).toContain("1 untested");
    expect(invLine).toContain("2 unspecified");
  }));

  test("logs suggestions when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      invariants: {
        specifiedOnly: 5, implementedUntested: 0, implementedTested: 10,
        unspecified: 0, topSpecGaps: [], topUntested: [], topUnspecified: [],
      },
    }));
    const sugLine = logs().find((l: string) => l.includes("Suggestions"));
    expect(sugLine).toContain("5 specified-only invariants need implementation");
  }));

  test("logs uncertainties when present", () => withLogSpy((logs) => {
    logAssessment(makeAssessment({
      uncertainties: [
        { field: "typecheckPass", reason: "missing type definitions (bun-types)" },
        { field: "healthScore", reason: "octoclean not installed" },
      ],
    }));
    const uncLine = logs().find((l: string) => l.includes("Uncertainties"));
    expect(uncLine).toContain("typecheckPass (missing type definitions (bun-types))");
    expect(uncLine).toContain("healthScore (octoclean not installed)");
  }));

  test("does not log uncertainties when empty or absent", () => withLogSpy((logs) => {
    logAssessment(makeAssessment());
    expect(logs().find((l: string) => l.includes("Uncertainties"))).toBeUndefined();
  }));
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
