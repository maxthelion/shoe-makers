import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { InvariantSummary } from "../types";

/**
 * Evidence rule for a claim.
 */
export interface EvidenceRule {
  sourceEvidence: string[][];
  testEvidence: string[][];
}

const EVIDENCE_PATH = ".shoe-makers/claim-evidence.yaml";

/**
 * Parse the claim-evidence YAML file into a Record<string, EvidenceRule>.
 *
 * Format:
 *   claim-id:
 *     source:
 *       - [pattern1, pattern2]
 *     test:
 *       - [pattern1]
 */
export function parseClaimEvidenceYaml(content: string): Record<string, EvidenceRule> {
  const result: Record<string, EvidenceRule> = {};
  let currentClaim: string | null = null;
  let currentField: "source" | "test" | null = null;

  for (const line of content.split("\n")) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // Top-level claim ID (no leading whitespace, ends with colon)
    const claimMatch = line.match(/^([a-z][\w.()-]+):$/);
    if (claimMatch) {
      currentClaim = claimMatch[1];
      result[currentClaim] = { sourceEvidence: [], testEvidence: [] };
      currentField = null;
      continue;
    }

    // source: or test: field
    const fieldMatch = line.match(/^\s+(source|test):$/);
    if (fieldMatch && currentClaim) {
      currentField = fieldMatch[1] as "source" | "test";
      continue;
    }

    // Array item: - [pattern1, pattern2]
    const arrayMatch = line.match(/^\s+-\s*\[(.+)\]$/);
    if (arrayMatch && currentClaim && currentField) {
      const patterns = parsePatternList(arrayMatch[1]);
      const key = currentField === "source" ? "sourceEvidence" : "testEvidence";
      result[currentClaim][key].push(patterns);
    }
  }

  return result;
}

/**
 * Parse a comma-separated list of patterns from inside YAML brackets.
 * Handles quoted strings (single or double) and unquoted values.
 */
function parsePatternList(raw: string): string[] {
  const patterns: string[] = [];
  let i = 0;
  while (i < raw.length) {
    // Skip whitespace and commas
    while (i < raw.length && (raw[i] === " " || raw[i] === ",")) i++;
    if (i >= raw.length) break;

    if (raw[i] === '"' || raw[i] === "'") {
      const quote = raw[i];
      i++;
      let value = "";
      while (i < raw.length && raw[i] !== quote) {
        if (raw[i] === "\\" && i + 1 < raw.length) {
          i++;
          value += raw[i];
        } else {
          value += raw[i];
        }
        i++;
      }
      i++; // skip closing quote
      patterns.push(value);
    } else {
      let value = "";
      while (i < raw.length && raw[i] !== "," && raw[i] !== "]") {
        value += raw[i];
        i++;
      }
      patterns.push(value.trim());
    }
  }
  return patterns;
}

/**
 * Load claim evidence from YAML file. Falls back to empty if file not found.
 */
async function loadClaimEvidence(repoRoot: string): Promise<Record<string, EvidenceRule>> {
  // Try repoRoot first, then fall back to cwd (for tests using temp dirs)
  for (const base of [repoRoot, process.cwd()]) {
    try {
      const content = await readFile(join(base, EVIDENCE_PATH), "utf-8");
      return parseClaimEvidenceYaml(content);
    } catch {
      continue;
    }
  }
  return {};
}

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
 * Extract falsifiable claims from a wiki page.
 * Returns claims that have evidence rules defined for this page.
 */
export function extractClaims(page: WikiPage, claimEvidence: Record<string, EvidenceRule> = {}): Claim[] {
  const claims: Claim[] = [];

  for (const claimId of Object.keys(claimEvidence)) {
    const [pageSlug] = claimId.split(".");
    if (pageSlug === page.filename) {
      const claimSlug = claimId.substring(pageSlug.length + 1);
      claims.push({
        id: claimId,
        text: claimSlug.replace(/-/g, " "),
        page: page.filename,
        group: page.category,
      });
    }
  }

  return claims;
}

/**
 * Parse .shoe-makers/invariants.md and extract every bullet point as a claim.
 * This is the AUTHORITATIVE source of claims — written by humans, not elves.
 * Claims without a matching CLAIM_EVIDENCE entry default to "specified-only".
 */
export async function extractInvariantClaims(repoRoot: string): Promise<Claim[]> {
  const invariantsPath = join(repoRoot, ".shoe-makers", "invariants.md");
  let content: string;
  try {
    content = await readFile(invariantsPath, "utf-8");
  } catch {
    return []; // no invariants file
  }

  const claims: Claim[] = [];
  let currentSection = "";
  let currentSubsection = "";

  for (const line of content.split("\n")) {
    const h2 = line.match(/^## \d+\.\s+(.+)/);
    if (h2) {
      currentSection = h2[1].trim().toLowerCase().replace(/\s+/g, "-");
      continue;
    }
    const h3 = line.match(/^### \d+\.\d+\s+(.+)/);
    if (h3) {
      currentSubsection = h3[1].trim().toLowerCase().replace(/\s+/g, "-");
      continue;
    }
    const bullet = line.match(/^- (.+)/);
    if (bullet && currentSection && currentSubsection) {
      const text = bullet[1].trim();
      // Generate a stable ID from section + subsection + simplified text
      const textSlug = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 60);
      const id = `spec.${currentSubsection}.${textSlug}`;
      claims.push({
        id,
        text,
        page: "invariants",
        group: currentSection,
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
  "init.ts", "run-init.ts", "schedule.ts",
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
  let specifiedOnly = 0;
  let implementedUntested = 0;
  let implementedTested = 0;

  // Check claims from wiki pages (existing behaviour)
  const specPages = pages.filter(
    (p) => p.category === "architecture" || p.category === "spec"
  );
  for (const page of specPages) {
    for (const claim of extractClaims(page, claimEvidence)) {
      const status = classifyClaim(claim, sourceContents, testContents, claimEvidence);
      const summary = { id: claim.id, description: claim.text, group: claim.group };

      if (status === "implemented-tested") {
        implementedTested++;
      } else if (status === "implemented-untested") {
        implementedUntested++;
        topUntested.push(summary);
      } else {
        specifiedOnly++;
        topSpecGaps.push(summary);
      }
    }
  }

  // Check claims from .shoe-makers/invariants.md (authoritative human-written spec)
  // These default to specified-only unless CLAIM_EVIDENCE has a matching entry
  for (const claim of specClaims) {
    const status = classifyClaim(claim, sourceContents, testContents, claimEvidence);
    const summary = { id: claim.id, description: claim.text, group: claim.group };

    if (status === "implemented-tested") {
      implementedTested++;
    } else if (status === "implemented-untested") {
      implementedUntested++;
      topUntested.push(summary);
    } else {
      specifiedOnly++;
      topSpecGaps.push(summary);
    }
  }

  const topUnspecified = findUnspecifiedDirs(sourceFiles, claimEvidence);

  return {
    specifiedOnly,
    implementedUntested,
    implementedTested,
    unspecified: topUnspecified.length,
    topSpecGaps,
    topUntested,
    topUnspecified,
  };
}
