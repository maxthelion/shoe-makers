import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";
import { buildWorldState } from "../setup/world-state";
import type { Assessment, Config } from "../types";

function makeAssessment(overrides: Partial<Assessment> = {}): Assessment {
  return {
    timestamp: new Date().toISOString(),
    invariants: null,
    healthScore: null,
    worstFiles: [],
    openPlans: [],
    findings: [],
    testsPass: true,
    typecheckPass: true,
    recentGitActivity: [],
    ...overrides,
  };
}

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    branchPrefix: "shoemakers",
    tickInterval: 5,
    wikiDir: "wiki",
    assessmentStaleAfter: 30,
    maxTicksPerShift: 10,
    enabledSkills: null,
    insightFrequency: 0.3,
    maxInnovationCycles: 3,
    ...overrides,
  };
}

describe("buildWorldState", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-bws-"));
    await mkdir(join(tempDir, ".shoe-makers", "state"), { recursive: true });
    await mkdir(join(tempDir, ".shoe-makers", "findings"), { recursive: true });
    await mkdir(join(tempDir, ".shoe-makers", "insights"), { recursive: true });
    // Initialize git so git-based checks work
    execSync("git init", { cwd: tempDir, stdio: "pipe" });
    execSync("git -c commit.gpgsign=false commit --allow-empty -m 'init'", { cwd: tempDir, stdio: "pipe" });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns correct defaults when no state files exist", async () => {
    const assessment = makeAssessment();
    const config = makeConfig();
    const state = await buildWorldState(tempDir, "test-branch", assessment, 0, config);

    expect(state.branch).toBe("test-branch");
    expect(state.hasWorkItem).toBe(false);
    expect(state.hasCandidates).toBe(false);
    expect(state.workItemSkillType).toBeNull();
    expect(state.hasPartialWork).toBe(false);
    expect(state.insightCount).toBe(0);
    expect(state.inboxCount).toBe(0);
    expect(state.unresolvedCritiqueCount).toBe(0);
  });

  test("detects work-item and candidates when state files exist", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "work-item.md"),
      "skill-type: implement\n\n# Test work item\n",
    );
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "candidates.md"),
      "# Candidates\n\n## 1. Something\n",
    );

    const state = await buildWorldState(tempDir, "test-branch", makeAssessment(), 0, makeConfig());

    expect(state.hasWorkItem).toBe(true);
    expect(state.hasCandidates).toBe(true);
    expect(state.workItemSkillType).toBe("implement");
  });

  test("counts unresolved critique findings", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "findings", "critique-2026-03-26-001.md"),
      "# Critique\n\nSomething is wrong.\n",
    );

    const state = await buildWorldState(tempDir, "test-branch", makeAssessment(), 0, makeConfig());

    expect(state.unresolvedCritiqueCount).toBe(1);
  });

  test("counts insights", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "insights", "2026-03-26-001.md"),
      "# Insight\n\nSomething interesting.\n",
    );
    await writeFile(
      join(tempDir, ".shoe-makers", "insights", "2026-03-26-002.md"),
      "# Another insight\n",
    );

    const state = await buildWorldState(tempDir, "test-branch", makeAssessment(), 0, makeConfig());

    expect(state.insightCount).toBe(2);
  });

  test("passes through branchName, assessment, inboxCount, and config", async () => {
    const assessment = makeAssessment({ healthScore: 95 });
    const config = makeConfig({ tickInterval: 10 });

    const state = await buildWorldState(tempDir, "my-branch", assessment, 5, config);

    expect(state.branch).toBe("my-branch");
    expect(state.inboxCount).toBe(5);
    expect(state.config).toBe(config);
    expect(state.blackboard.assessment).toBe(assessment);
    expect(state.blackboard.assessment?.healthScore).toBe(95);
  });

  test("detects partial work when partial-work.md exists", async () => {
    await writeFile(
      join(tempDir, ".shoe-makers", "state", "partial-work.md"),
      "# Partial work\n\nStopped mid-implementation.\n",
    );

    const state = await buildWorldState(tempDir, "test-branch", makeAssessment(), 0, makeConfig());

    expect(state.hasPartialWork).toBe(true);
  });

  test("blackboard has null defaults for non-assessment fields", async () => {
    const state = await buildWorldState(tempDir, "test-branch", makeAssessment(), 0, makeConfig());

    expect(state.blackboard.currentTask).toBeNull();
    expect(state.blackboard.priorities).toBeNull();
    expect(state.blackboard.verification).toBeNull();
  });
});
