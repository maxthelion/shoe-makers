import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { WorldState, Blackboard, Assessment, TreeNode } from "../types";

export function emptyBlackboard(): Blackboard {
  return {
    assessment: null,
    currentTask: null,
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
