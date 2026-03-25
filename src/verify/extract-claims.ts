import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { EvidenceRule } from "./parse-evidence";
import { parseFrontmatter as parseFm, getFrontmatterField } from "../utils/frontmatter";

/**
 * A wiki page with parsed frontmatter.
 */
export interface WikiPage {
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
  const result = parseFm(content);
  if (!result) return { title: "", category: "" };

  const title = getFrontmatterField(result.frontmatter, "title") ?? "";
  const category = getFrontmatterField(result.frontmatter, "category") ?? "";
  return { title, category };
}

/**
 * Read all wiki pages and parse their frontmatter.
 */
export async function readWikiPages(repoRoot: string, wikiDir: string = "wiki"): Promise<WikiPage[]> {
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
      currentSection = h2[1].trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      continue;
    }
    const h3 = line.match(/^### \d+\.\d+\s+(.+)/);
    if (h3) {
      currentSubsection = h3[1].trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
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
