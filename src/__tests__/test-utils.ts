import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { WorldState, Blackboard, Assessment, TreeNode } from "../types";

export function emptyBlackboard(): Blackboard {
  return {
    assessment: null,
    currentTask: null,
    priorities: null,
    verification: null,
  };
}

export const freshAssessment: Assessment = {
  timestamp: new Date().toISOString(),
  invariants: {
    specifiedOnly: 0,
    implementedUntested: 0,
    implementedTested: 50,
    unspecified: 0,
    topSpecGaps: [],
    topUntested: [],
    topUnspecified: [],
  },
  healthScore: 80,
  worstFiles: [],
  openPlans: [],
  findings: [],
  testsPass: true,
  recentGitActivity: [],
};

export function makeStateWith(
  assessmentOverrides: Partial<Assessment> & { invariants?: Partial<NonNullable<Assessment["invariants"]>> | null } = {},
  stateOverrides: Partial<WorldState> = {}
): WorldState {
  const { invariants: invOverrides, ...rest } = assessmentOverrides;
  const assessment: Assessment = {
    ...freshAssessment,
    ...rest,
    invariants: invOverrides === null ? null : invOverrides !== undefined
      ? { ...freshAssessment.invariants!, ...invOverrides }
      : freshAssessment.invariants,
  };
  return makeState({
    blackboard: {
      ...emptyBlackboard(),
      assessment,
    },
    ...stateOverrides,
  });
}

export function makeState(overrides: Partial<WorldState> = {}): WorldState {
  return {
    branch: "shoemakers/2026-03-21",
    hasUncommittedChanges: false,
    inboxCount: 0,
    hasUnreviewedCommits: false,
    unresolvedCritiqueCount: 0,
    hasWorkItem: false,
    hasCandidates: false,
    workItemSkillType: null,
    hasPartialWork: false,
    insightCount: 0,
    blackboard: {
      ...emptyBlackboard(),
      assessment: freshAssessment,
    },
    ...overrides,
  };
}

/**
 * Write a wiki page with frontmatter to a temp dir.
 */
export async function writeWikiPage(
  tempDir: string,
  name: string,
  title: string,
  category: string,
  body: string = ""
): Promise<void> {
  const dir = join(tempDir, "wiki", "pages");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${name}.md`),
    `---\ntitle: ${title}\ncategory: ${category}\n---\n# ${title}\n${body}`
  );
}

/**
 * Write a source file under src/ in a temp dir.
 */
export async function writeSourceFile(
  tempDir: string,
  path: string,
  content: string = "// source\n"
): Promise<void> {
  const fullPath = join(tempDir, "src", path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content);
}

/**
 * Write a test file under src/ in a temp dir.
 */
export async function writeTestFile(
  tempDir: string,
  path: string,
  content: string = "// test\n"
): Promise<void> {
  const fullPath = join(tempDir, "src", path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content);
}

/**
 * Write a claim-evidence.yaml file in a temp dir.
 */
export async function writeClaimEvidence(
  tempDir: string,
  yaml: string
): Promise<void> {
  const dir = join(tempDir, ".shoe-makers");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "claim-evidence.yaml"), yaml);
}

/**
 * Create a temporary directory, run a callback with it, then clean up.
 * Replaces repeated beforeEach/afterEach patterns for temp dir management.
 */
export async function withTempDir(
  prefix: string,
  fn: (dir: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), `shoe-makers-${prefix}-`));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Create an assessment with specific invariant overrides.
 * Starts from freshAssessment and merges invariant fields + extra top-level fields.
 */
export function makeAssessment(
  invariantOverrides: Partial<NonNullable<Assessment["invariants"]>> = {},
  extra: Partial<Assessment> = {},
): Assessment {
  return {
    ...freshAssessment,
    invariants: { ...freshAssessment.invariants!, ...invariantOverrides },
    ...extra,
  };
}

/**
 * Create a world state with a specific assessment, using the shared makeState helper.
 */
export function makeStateWithAssessment(assessment: Assessment): WorldState {
  return makeState({ blackboard: { ...emptyBlackboard(), assessment } });
}

/** Recursively extract all unique skill names from a tree node */
export function extractSkills(node: TreeNode): Set<string> {
  const skills = new Set<string>();
  if (node.type === "action" && node.skill) {
    skills.add(node.skill);
  }
  if (node.children) {
    for (const child of node.children) {
      for (const s of extractSkills(child)) {
        skills.add(s);
      }
    }
  }
  return skills;
}
