import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { InvariantSummary } from "../types";

export interface InvariantReport {
  specifiedOnly: number;
  implementedUntested: number;
  implementedTested: number;
  unspecified: number;
  topSpecGaps: InvariantSummary[];
  topUntested: InvariantSummary[];
  topUnspecified: InvariantSummary[];
}

interface WikiPage {
  filename: string;
  title: string;
  category: string;
  content: string;
}

/**
 * A single falsifiable claim extracted from a wiki page.
 */
export interface Claim {
  id: string;
  text: string;
  page: string;
  group: string;
}

/**
 * Evidence rule for a claim.
 *
 * sourceEvidence: patterns to find in source code (non-comment lines).
 *   Each sub-array is a group of alternatives — any match in the group counts.
 *   ALL groups must have at least one match for the claim to be "implemented".
 *
 * testEvidence: same structure for test files.
 *   ALL groups must match for the claim to be "tested".
 *
 * Example: sourceEvidence: [["case \"selector\"", "node.type === \"selector\""], ["children"]]
 *   means: (case "selector" OR node.type === "selector") AND (children)
 */
interface EvidenceRule {
  sourceEvidence: string[][];
  testEvidence: string[][];
}

/**
 * Parse frontmatter from a wiki page.
 */
function parseFrontmatter(content: string): { title: string; category: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { title: "", category: "" };

  const fm = match[1];
  const title = fm.match(/title:\s*(.+)/)?.[1]?.trim() ?? "";
  const category = fm.match(/category:\s*(.+)/)?.[1]?.trim() ?? "";
  return { title, category };
}

/**
 * Read all wiki pages and parse their frontmatter.
 */
async function readWikiPages(repoRoot: string, wikiDir: string = "wiki"): Promise<WikiPage[]> {
  const pagesDir = join(repoRoot, wikiDir, "pages");
  const pages: WikiPage[] = [];

  try {
    const files = await readdir(pagesDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await readFile(join(pagesDir, file), "utf-8");
      const { title, category } = parseFrontmatter(content);
      pages.push({ filename: file.replace(".md", ""), title, category, content });
    }
  } catch {
    // wiki/pages may not exist
  }

  return pages;
}

/**
 * List all source files in src/.
 */
async function listSourceFiles(repoRoot: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string, prefix: string = ""): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walk(join(dir, entry.name), relative);
        } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
          files.push(relative);
        }
      }
    } catch {
      // directory may not exist
    }
  }

  await walk(join(repoRoot, "src"));
  return files;
}

/**
 * List all test files in src/.
 */
async function listTestFiles(repoRoot: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string, prefix: string = ""): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walk(join(dir, entry.name), relative);
        } else if (entry.name.endsWith(".test.ts")) {
          files.push(relative);
        }
      }
    } catch {
      // directory may not exist
    }
  }

  await walk(join(repoRoot, "src"));
  return files;
}

/**
 * Read file contents, stripping single-line comments (// ...) and
 * multi-line comments to avoid false positive matches on TODOs/notes.
 */
async function readCodeContents(repoRoot: string, files: string[]): Promise<Map<string, string>> {
  const contents = new Map<string, string>();
  for (const file of files) {
    try {
      let content = await readFile(join(repoRoot, "src", file), "utf-8");
      // Strip single-line comments
      content = content.replace(/\/\/.*$/gm, "");
      // Strip multi-line comments
      content = content.replace(/\/\*[\s\S]*?\*\//g, "");
      // Strip CLAIM_EVIDENCE mapping to avoid self-referential matches
      if (file === "verify/invariants.ts") {
        content = content.replace(/const CLAIM_EVIDENCE[\s\S]*?^};/m, "");
      }
      contents.set(file, content);
    } catch {
      // file may have been deleted
    }
  }
  return contents;
}

/**
 * Granular claim-to-evidence mapping.
 *
 * Each claim ID is page.claim-slug. Evidence rules use AND-of-OR groups:
 * all groups must have at least one matching pattern.
 */
const CLAIM_EVIDENCE: Record<string, EvidenceRule> = {
  // === behaviour-tree.md ===
  "behaviour-tree.tree-evaluator": {
    sourceEvidence: [["export function evaluate"]],
    testEvidence: [["evaluate("]],
  },
  "behaviour-tree.selector-tries-children": {
    sourceEvidence: [["\"selector\""], ["children"]],
    testEvidence: [["selector"]],
  },
  "behaviour-tree.sequence-runs-in-order": {
    sourceEvidence: [["\"sequence\""], ["children"]],
    testEvidence: [["sequence"]],
  },
  "behaviour-tree.re-evaluates-from-scratch": {
    sourceEvidence: [["evaluate(defaultTree", "evaluate(node"]],
    testEvidence: [["evaluate("]],
  },
  "behaviour-tree.staleness-drives-pacing": {
    sourceEvidence: [["isAssessmentStale"], ["isPrioritisationStale"]],
    testEvidence: [["stale"]],
  },
  "behaviour-tree.macro-micro-priority": {
    // Two levels: macro in tree order (exists), micro in LLM prioritiser (not yet)
    // Macro: tree evaluation order. Micro: LLM-based ranking.
    // Requires both tree evaluation AND LLM-based ranking in prioritiser.
    sourceEvidence: [["rankCandidates"], ["new Anthropic(", "messages.create("]],
    testEvidence: [["rank"]],
  },
  "behaviour-tree.llm-prioritiser": {
    // "The PRIORITISE tick uses an LLM to weigh candidates"
    // Requires actual LLM API call in prioritise.ts
    sourceEvidence: [["new Anthropic(", "createMessage(", "messages.create("]],
    testEvidence: [["mock.*anthropic", "mock.*llm"]],
  },
  "behaviour-tree.should-never-sleep": {
    // Requires granular invariants so system always finds work
    sourceEvidence: [["extractClaims"], ["CLAIM_EVIDENCE"]],
    testEvidence: [["extractClaims"]],
  },
  "behaviour-tree.blackboard-pattern": {
    sourceEvidence: [["readBlackboard"], ["writeAssessment"]],
    testEvidence: [["blackboard"]],
  },
  "behaviour-tree.four-tick-cycle": {
    sourceEvidence: [["\"assess\""], ["\"prioritise\""], ["\"work\""], ["\"verify\""]],
    testEvidence: [["assess"], ["prioritise"]],
  },

  // === architecture.md ===
  "architecture.tick-every-5-minutes": {
    sourceEvidence: [["tickInterval"]],
    testEvidence: [["tickInterval"]],
  },
  "architecture.tree-routes-to-tick-types": {
    sourceEvidence: [["TickType"], ["evaluate("]],
    testEvidence: [["tickType"]],
  },
  "architecture.blackboard-state-files": {
    sourceEvidence: [["shoe-makers/state"], ["assessment.json"]],
    testEvidence: [["assessment.json"]],
  },
  "architecture.agents-pure-functions": {
    sourceEvidence: [["AgentResult"]],
    testEvidence: [["AgentResult"]],
  },
  "architecture.config-in-shoe-makers": {
    sourceEvidence: [["loadConfig"], ["config.yaml"]],
    testEvidence: [["loadConfig"]],
  },
  "architecture.branch-is-state": {
    sourceEvidence: [["getCurrentBranch"]],
    testEvidence: [["branch"]],
  },

  // === pure-function-agents.md ===
  "pure-function-agents.agent-interface": {
    sourceEvidence: [["AgentResult"]],
    testEvidence: [["AgentResult"]],
  },
  "pure-function-agents.scheduler-handles-side-effects": {
    sourceEvidence: [["runSkill"]],
    testEvidence: [["runSkill"]],
  },
  "pure-function-agents.partial-work-status": {
    sourceEvidence: [["\"partial\""]],
    testEvidence: [["partial"]],
  },

  // === tick-types.md ===
  "tick-types.assess-writes-assessment": {
    sourceEvidence: [["writeAssessment"]],
    testEvidence: [["assessment"]],
  },
  "tick-types.prioritise-writes-priorities": {
    sourceEvidence: [["writePriorities"]],
    testEvidence: [["priorities"]],
  },
  "tick-types.work-writes-current-task": {
    sourceEvidence: [["writeCurrentTask"]],
    testEvidence: [["currentTask", "current-task"]],
  },
  "tick-types.verify-writes-verification": {
    sourceEvidence: [["writeVerification"]],
    testEvidence: [["verification"]],
  },
  "tick-types.staleness-not-scheduling": {
    sourceEvidence: [["isAssessmentStale"], ["isPrioritisationStale"]],
    testEvidence: [["stale"]],
  },
  "tick-types.assess-gathers-invariants": {
    sourceEvidence: [["checkInvariants"]],
    testEvidence: [["invariants"]],
  },
  "tick-types.assess-gathers-test-results": {
    sourceEvidence: [["runTests", "testsPass"]],
    testEvidence: [["testsPass"]],
  },
  "tick-types.assess-gathers-git-activity": {
    sourceEvidence: [["getRecentGitActivity", "recentGitActivity"]],
    testEvidence: [["recentGitActivity", "gitActivity"]],
  },
  "tick-types.assess-gathers-plans": {
    sourceEvidence: [["findOpenPlans", "openPlans"]],
    testEvidence: [["openPlans", "plans"]],
  },

  // === invariants.md ===
  "invariants.four-statuses": {
    sourceEvidence: [["specifiedOnly"], ["implementedUntested"], ["implementedTested"]],
    testEvidence: [["specifiedOnly", "implementedTested"]],
  },
  "invariants.extract-falsifiable-claims": {
    sourceEvidence: [["export function extractClaims"]],
    testEvidence: [["extractClaims"]],
  },
  "invariants.four-stage-pipeline": {
    // Full Stages 0-3 with LLM extraction — not implemented
    sourceEvidence: [["synthesiseCode("], ["runPipeline(", "runStage("]],
    testEvidence: [["synthesiseCode(", "runPipeline("]],
  },
  "invariants.report-drives-behaviour-tree": {
    sourceEvidence: [["checkInvariants"], ["specifiedOnly"]],
    testEvidence: [["checkInvariants"]],
  },
  "invariants.granularity-per-claim": {
    sourceEvidence: [["export function extractClaims"], ["checkEvidence"]],
    testEvidence: [["extractClaims"]],
  },

  // === verification.md ===
  "verification.tests-must-pass": {
    sourceEvidence: [["testsPass"]],
    testEvidence: [["testsPass"]],
  },
  "verification.commit-or-revert": {
    sourceEvidence: [["\"commit\""], ["\"revert\""]],
    testEvidence: [["commit"], ["revert"]],
  },
  "verification.adversarial-llm-review": {
    // LLM-based adversarial review — not implemented
    sourceEvidence: [["async function adversarialReview(", "async function llmReview("]],
    testEvidence: [["adversarialReview(", "llmReview("]],
  },
  "verification.architectural-contract-check": {
    // Architectural contract checking — not implemented
    sourceEvidence: [["async function checkContracts(", "async function checkArchitectural("]],
    testEvidence: [["checkContracts(", "checkArchitectural("]],
  },

  // === skills.md ===
  "skills.markdown-skill-files": {
    sourceEvidence: [["loadSkills"], ["parseSkillFile"]],
    testEvidence: [["loadSkills", "parseSkillFile"]],
  },
  "skills.registry-matches-types": {
    sourceEvidence: [["findSkillForType"]],
    testEvidence: [["findSkillForType"]],
  },
  "skills.frontmatter-interface": {
    sourceEvidence: [["maps-to", "mapsTo"]],
    testEvidence: [["maps-to", "mapsTo"]],
  },

  // === observability.md ===
  "observability.shift-log-per-day": {
    sourceEvidence: [["appendToShiftLog"]],
    testEvidence: [["appendToShiftLog", "shiftLog"]],
  },
  "observability.findings-directory": {
    // Findings should be read during assess, as part of world state
    sourceEvidence: [["readFindings(", "loadFindings(", "shoe-makers/findings"]],
    testEvidence: [["findings"]],
  },
  "observability.timestamped-entries": {
    sourceEvidence: [["timeStamp", "timestamp"]],
    testEvidence: [["timestamp"]],
  },

  // === wiki-as-spec.md ===
  "wiki-as-spec.four-statuses": {
    sourceEvidence: [["specifiedOnly"], ["implementedUntested"], ["implementedTested"], ["unspecified"]],
    testEvidence: [["specifiedOnly"]],
  },
  "wiki-as-spec.three-questions-drive-work": {
    // specifiedOnly → implement, implementedUntested → test, unspecified → doc-sync
    sourceEvidence: [["specifiedOnly"], ["implementedUntested"]],
    testEvidence: [["specifiedOnly"]],
  },
  "wiki-as-spec.agents-route-by-status": {
    // ImplementAgent for specified-only, TestAgent for untested, DocSyncAgent for unspecified
    sourceEvidence: [["\"implement\""], ["\"test\""], ["\"doc-sync\""]],
    testEvidence: [["implement"]],
  },

  // === branching-strategy.md ===
  "branching-strategy.one-branch-per-shift": {
    sourceEvidence: [["branchPrefix"]],
    testEvidence: [["branch"]],
  },
  "branching-strategy.branch-is-state": {
    sourceEvidence: [["getCurrentBranch"], ["hasUncommittedChanges"]],
    testEvidence: [["branch"]],
  },

  // === functionality.md ===
  "functionality.inbox-reads-messages": {
    // "Inbox (.shoe-makers/inbox/): drop a markdown file, the next elf reads it"
    sourceEvidence: [["shoe-makers/inbox", ".shoe-makers/inbox"]],
    testEvidence: [["inbox"]],
  },
  "functionality.findings-persist-across-shifts": {
    // "Findings (.shoe-makers/findings/): persistent observations that survive across shifts"
    sourceEvidence: [["readFindings(", "shoe-makers/findings"]],
    testEvidence: [["findings"]],
  },
  "functionality.shift-log-narrative": {
    // "The branch contains a shift log explaining the narrative of the night's work"
    sourceEvidence: [["appendToShiftLog"], ["formatTickLog"]],
    testEvidence: [["appendToShiftLog", "formatTickLog"]],
  },
  "functionality.config-yaml": {
    // "Configure via .shoe-makers/config.yaml (tick interval, staleness thresholds, enabled skills, branch prefix)"
    sourceEvidence: [["config.yaml"], ["tickInterval"], ["assessmentStaleAfter"], ["branchPrefix"]],
    testEvidence: [["config"]],
  },
  "functionality.plan-status-lifecycle": {
    // "Plans describe what the system should become — they are deltas"
    // Plans have status: blocked/done to manage lifecycle
    sourceEvidence: [["findOpenPlans"], ["status:\\s*(blocked|done)", "status: blocked", "status: done"]],
    testEvidence: [["plan"]],
  },
  "functionality.skills-as-markdown": {
    // "Skills are markdown files in .shoe-makers/skills/ loaded by a registry"
    sourceEvidence: [["loadSkills"], ["parseSkillFile"]],
    testEvidence: [["loadSkills", "parseSkillFile"]],
  },
  "functionality.multi-tick-shift": {
    // Shift runner cycles assess → prioritise → work → verify
    sourceEvidence: [["export async function shift"]],
    testEvidence: [["shift("]],
  },
  "functionality.task-lifecycle-cli": {
    // "bun run task:status, task:done, task:fail"
    sourceEvidence: [["task:status", "\"status\""], ["task:done", "\"done\""], ["task:fail", "\"fail\""]],
    testEvidence: [["task"]],
  },

  // === plans-vs-spec.md ===
  "plans-vs-spec.plan-category-in-frontmatter": {
    sourceEvidence: [["findOpenPlans"], ["category"]],
    testEvidence: [["plan"]],
  },
  "plans-vs-spec.plans-feed-prioritiser": {
    sourceEvidence: [["openPlans"], ["Implement plan", "type: \"plan\""]],
    testEvidence: [["openPlans", "plan"]],
  },
};

/**
 * Extract falsifiable claims from a wiki page.
 * Returns claims that have evidence rules defined for this page.
 */
export function extractClaims(page: WikiPage): Claim[] {
  const claims: Claim[] = [];

  for (const claimId of Object.keys(CLAIM_EVIDENCE)) {
    const [pageSlug] = claimId.split(".");
    if (pageSlug === page.filename) {
      const claimSlug = claimId.substring(pageSlug.length + 1);
      const description = claimSlug.replace(/-/g, " ");
      claims.push({
        id: claimId,
        text: description,
        page: page.filename,
        group: page.category,
      });
    }
  }

  return claims;
}

/**
 * Check whether evidence groups are satisfied.
 * Each group is an array of alternative patterns — at least one must match.
 * ALL groups must be satisfied (AND-of-OR).
 */
function checkEvidence(
  groups: string[][],
  contents: Map<string, string>
): boolean {
  if (groups.length === 0) return false;

  const allContents = [...contents.values()].join("\n");
  const lowerContents = allContents.toLowerCase();

  return groups.every((alternatives) =>
    alternatives.some((pattern) => lowerContents.includes(pattern.toLowerCase()))
  );
}

/**
 * Granular invariants check: extracts individual claims from wiki pages
 * and checks each one against source code and test evidence.
 *
 * This replaces the coarse topic-to-directory mapping with per-claim checking.
 * Each wiki page can have multiple claims, each independently classified.
 */
export async function checkInvariants(repoRoot: string, wikiDir: string = "wiki"): Promise<InvariantReport> {
  const [pages, sourceFiles, testFiles] = await Promise.all([
    readWikiPages(repoRoot, wikiDir),
    listSourceFiles(repoRoot),
    listTestFiles(repoRoot),
  ]);

  // Read actual file contents for evidence matching (comments stripped)
  const [sourceContents, testContents] = await Promise.all([
    readCodeContents(repoRoot, sourceFiles),
    readCodeContents(repoRoot, testFiles),
  ]);

  const specPages = pages.filter(
    (p) => p.category === "architecture" || p.category === "spec"
  );

  const topSpecGaps: InvariantSummary[] = [];
  const topUntested: InvariantSummary[] = [];
  const topUnspecified: InvariantSummary[] = [];

  let specifiedOnly = 0;
  let implementedUntested = 0;
  let implementedTested = 0;

  for (const page of specPages) {
    const claims = extractClaims(page);

    for (const claim of claims) {
      const rule = CLAIM_EVIDENCE[claim.id];
      if (!rule) continue;

      const hasSource = checkEvidence(rule.sourceEvidence, sourceContents);
      const hasTests = checkEvidence(rule.testEvidence, testContents);

      if (hasSource && hasTests) {
        implementedTested++;
      } else if (hasSource && !hasTests) {
        implementedUntested++;
        topUntested.push({
          id: claim.id,
          description: claim.text,
          group: claim.group,
        });
      } else {
        specifiedOnly++;
        topSpecGaps.push({
          id: claim.id,
          description: claim.text,
          group: claim.group,
        });
      }
    }
  }

  // Check for source code with no corresponding spec claims
  const codeDirs = new Set(
    sourceFiles
      .map((f) => f.split("/")[0])
      .filter((d) => d !== "types.ts" && d !== "index.ts" && d !== "tick.ts" && d !== "shift.ts" && d !== "task.ts")
  );

  const mappedDirs = new Set<string>();
  for (const rule of Object.values(CLAIM_EVIDENCE)) {
    for (const group of rule.sourceEvidence) {
      for (const pattern of group) {
        const slashIdx = pattern.indexOf("/");
        if (slashIdx > 0) {
          mappedDirs.add(pattern.substring(0, slashIdx));
        }
      }
    }
  }
  for (const dir of codeDirs) {
    const hasEvidence = Object.values(CLAIM_EVIDENCE).some((rule) =>
      rule.sourceEvidence.some((group) =>
        group.some((p) => p.toLowerCase().includes(dir.toLowerCase()))
      )
    );
    if (hasEvidence) mappedDirs.add(dir);
  }

  let unspecified = 0;
  for (const dir of codeDirs) {
    if (!mappedDirs.has(dir)) {
      unspecified++;
      topUnspecified.push({
        id: `code.${dir}`,
        description: `Source directory "${dir}" has no corresponding wiki spec claims`,
        group: "unspecified",
      });
    }
  }

  return {
    specifiedOnly,
    implementedUntested,
    implementedTested,
    unspecified,
    topSpecGaps,
    topUntested,
    topUnspecified,
  };
}
