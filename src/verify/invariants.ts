import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { InvariantSummary } from "../types";
import { type EvidenceRule, loadClaimEvidence } from "./parse-evidence";
import { type Claim, extractClaims, extractInvariantClaims, readWikiPages } from "./extract-claims";


export interface InvariantReport {
  specifiedOnly: number;
  implementedUntested: number;
  implementedTested: number;
  unspecified: number;
  topSpecGaps: InvariantSummary[];
  topUntested: InvariantSummary[];
  topUnspecified: InvariantSummary[];
}

/**
 * Recursively list .ts files in src/, filtered by a predicate on the filename.
 */
async function walkTsFiles(
  dir: string,
  prefix: string,
  predicate: (name: string) => boolean
): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        files.push(...await walkTsFiles(join(dir, entry.name), relative, predicate));
      } else if (predicate(entry.name)) {
        files.push(relative);
      }
    }
  } catch {
    // directory may not exist
  }
  return files;
}

async function listSourceFiles(repoRoot: string): Promise<string[]> {
  return walkTsFiles(join(repoRoot, "src"), "", (name) => name.endsWith(".ts") && !name.endsWith(".test.ts"));
}

async function listTestFiles(repoRoot: string): Promise<string[]> {
  return walkTsFiles(join(repoRoot, "src"), "", (name) => name.endsWith(".test.ts"));
}

/**
 * Read file contents, stripping comments to avoid false positive matches.
 */
async function readCodeContents(repoRoot: string, files: string[]): Promise<Map<string, string>> {
  const contents = new Map<string, string>();
  for (const file of files) {
    try {
      let content = await readFile(join(repoRoot, "src", file), "utf-8");
      content = content.replace(/\/\/.*$/gm, "");
      content = content.replace(/\/\*[\s\S]*?\*\//g, "");
      contents.set(file, content);
    } catch {
      // file may have been deleted
    }
  }
  return contents;
}

/**
 * Check whether evidence groups are satisfied.
 * Each group is an array of alternative patterns — at least one must match.
 * ALL groups must be satisfied (AND-of-OR).
 */
function checkEvidence(groups: string[][], contents: Map<string, string>): boolean {
  if (groups.length === 0) return false;

  const allContents = [...contents.values()].join("\n");
  const lowerContents = allContents.toLowerCase();

  return groups.every((alternatives) =>
    alternatives.some((pattern) => lowerContents.includes(pattern.toLowerCase()))
  );
}

/**
 * Classify a single claim based on source and test evidence.
 */
function classifyClaim(
  claim: Claim,
  sourceContents: Map<string, string>,
  testContents: Map<string, string>,
  claimEvidence: Record<string, EvidenceRule>
): "implemented-tested" | "implemented-untested" | "specified-only" {
  const rule = claimEvidence[claim.id];
  if (!rule) return "specified-only";

  const hasSource = checkEvidence(rule.sourceEvidence, sourceContents);
  const hasTests = checkEvidence(rule.testEvidence, testContents);

  if (hasSource && hasTests) return "implemented-tested";
  if (hasSource) return "implemented-untested";
  return "specified-only";
}

/** Top-level files excluded from unspecified-directory detection. */
const EXCLUDED_TOP_LEVEL = new Set([
  "types.ts", "index.ts", "tick.ts", "shift.ts", "task.ts", "setup.ts", "prompts.ts",
  "init.ts", "init-templates.ts", "init-skill-templates-work.ts",
  "init-skill-templates-quality.ts", "init-skill-templates-docs.ts", "run-init.ts", "schedule.ts",
]);

/**
 * Find source directories that have no corresponding spec claims.
 */
function findUnspecifiedDirs(sourceFiles: string[], claimEvidence: Record<string, EvidenceRule>): InvariantSummary[] {
  const codeDirs = new Set(
    sourceFiles.map((f) => f.split("/")[0]).filter((d) => !EXCLUDED_TOP_LEVEL.has(d))
  );

  const mappedDirs = new Set<string>();
  for (const dir of codeDirs) {
    const hasEvidence = Object.values(claimEvidence).some((rule) =>
      rule.sourceEvidence.some((group) =>
        group.some((p) => p.toLowerCase().includes(dir.toLowerCase()))
      )
    );
    if (hasEvidence) mappedDirs.add(dir);
  }

  const results: InvariantSummary[] = [];
  for (const dir of codeDirs) {
    if (!mappedDirs.has(dir)) {
      results.push({
        id: `code.${dir}`,
        description: `Source directory "${dir}" has no corresponding wiki spec claims`,
        group: "unspecified",
      });
    }
  }
  return results;
}

/**
 * Classify claims and accumulate results into counters and gap lists.
 */
function accumulateClaims(
  claims: Claim[],
  sourceContents: Map<string, string>,
  testContents: Map<string, string>,
  claimEvidence: Record<string, EvidenceRule>,
  counters: { specifiedOnly: number; implementedUntested: number; implementedTested: number },
  topSpecGaps: InvariantSummary[],
  topUntested: InvariantSummary[],
): void {
  for (const claim of claims) {
    const status = classifyClaim(claim, sourceContents, testContents, claimEvidence);
    const summary = { id: claim.id, description: claim.text, group: claim.group };

    if (status === "implemented-tested") {
      counters.implementedTested++;
    } else if (status === "implemented-untested") {
      counters.implementedUntested++;
      topUntested.push(summary);
    } else {
      counters.specifiedOnly++;
      topSpecGaps.push(summary);
    }
  }
}

/**
 * Granular invariants check: extracts individual claims from wiki pages
 * and checks each one against source code and test evidence.
 */
export async function checkInvariants(repoRoot: string, wikiDir: string = "wiki"): Promise<InvariantReport> {
  const [pages, sourceFiles, testFiles, specClaims, claimEvidence] = await Promise.all([
    readWikiPages(repoRoot, wikiDir),
    listSourceFiles(repoRoot),
    listTestFiles(repoRoot),
    extractInvariantClaims(repoRoot),
    loadClaimEvidence(repoRoot),
  ]);

  const [sourceContents, testContents] = await Promise.all([
    readCodeContents(repoRoot, sourceFiles),
    readCodeContents(repoRoot, testFiles),
  ]);

  const topSpecGaps: InvariantSummary[] = [];
  const topUntested: InvariantSummary[] = [];
  const counters = { specifiedOnly: 0, implementedUntested: 0, implementedTested: 0 };

  // Check claims from wiki pages
  const specPages = pages.filter(
    (p) => p.category === "architecture" || p.category === "spec"
  );
  const wikiClaims = specPages.flatMap((page) => extractClaims(page, claimEvidence));
  accumulateClaims(wikiClaims, sourceContents, testContents, claimEvidence, counters, topSpecGaps, topUntested);

  // Check claims from .shoe-makers/invariants.md (authoritative human-written spec)
  accumulateClaims(specClaims, sourceContents, testContents, claimEvidence, counters, topSpecGaps, topUntested);

  const topUnspecified = findUnspecifiedDirs(sourceFiles, claimEvidence);

  return {
    specifiedOnly: counters.specifiedOnly,
    implementedUntested: counters.implementedUntested,
    implementedTested: counters.implementedTested,
    unspecified: topUnspecified.length,
    topSpecGaps,
    topUntested,
    topUnspecified,
  };
}
