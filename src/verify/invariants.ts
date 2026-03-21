import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { InvariantSummary } from "../types";
import { CLAIM_EVIDENCE } from "./claim-evidence";

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
      if (file === "verify/claim-evidence.ts") {
        content = content.replace(/export const CLAIM_EVIDENCE[\s\S]*?^};/m, "");
      }
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
export function extractClaims(page: WikiPage): Claim[] {
  const claims: Claim[] = [];

  for (const claimId of Object.keys(CLAIM_EVIDENCE)) {
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
  testContents: Map<string, string>
): "implemented-tested" | "implemented-untested" | "specified-only" {
  const rule = CLAIM_EVIDENCE[claim.id];
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
]);

/**
 * Find source directories that have no corresponding spec claims.
 */
function findUnspecifiedDirs(sourceFiles: string[]): InvariantSummary[] {
  const codeDirs = new Set(
    sourceFiles.map((f) => f.split("/")[0]).filter((d) => !EXCLUDED_TOP_LEVEL.has(d))
  );

  const mappedDirs = new Set<string>();
  for (const dir of codeDirs) {
    const hasEvidence = Object.values(CLAIM_EVIDENCE).some((rule) =>
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
  const [pages, sourceFiles, testFiles] = await Promise.all([
    readWikiPages(repoRoot, wikiDir),
    listSourceFiles(repoRoot),
    listTestFiles(repoRoot),
  ]);

  const [sourceContents, testContents] = await Promise.all([
    readCodeContents(repoRoot, sourceFiles),
    readCodeContents(repoRoot, testFiles),
  ]);

  const specPages = pages.filter(
    (p) => p.category === "architecture" || p.category === "spec"
  );

  const topSpecGaps: InvariantSummary[] = [];
  const topUntested: InvariantSummary[] = [];
  let specifiedOnly = 0;
  let implementedUntested = 0;
  let implementedTested = 0;

  for (const page of specPages) {
    for (const claim of extractClaims(page)) {
      const status = classifyClaim(claim, sourceContents, testContents);
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

  const topUnspecified = findUnspecifiedDirs(sourceFiles);

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
