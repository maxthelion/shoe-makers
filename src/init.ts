import { mkdir, writeFile, readFile, readdir } from "fs/promises";
import { join } from "path";
import {
  PROTOCOL_CONTENT,
  CONFIG_CONTENT,
  SCHEDULE_CONTENT,
  INVARIANTS_TEMPLATE,
} from "./init-templates";
import { fileExists } from "./utils/fs";
import {
  IMPLEMENT_SKILL,
  BUG_FIX_SKILL,
  OCTOCLEAN_FIX_SKILL,
  DEPENDENCY_UPDATE_SKILL,
} from "./init-skill-templates-work";
import {
  FIX_TESTS_SKILL,
  HEALTH_SKILL,
  DEAD_CODE_SKILL,
} from "./init-skill-templates-quality";
import {
  TEST_COVERAGE_SKILL,
  DOC_SYNC_SKILL,
} from "./init-skill-templates-docs";

export interface InitResult {
  created: string[];
  skipped: string[];
}

interface ScaffoldFile {
  path: string;
  content: string;
}

/**
 * Scaffold .shoe-makers/ directory structure in a repository.
 * Does not overwrite existing files — safe to run multiple times.
 */
export async function init(repoRoot: string): Promise<InitResult> {
  const base = join(repoRoot, ".shoe-makers");
  const created: string[] = [];
  const skipped: string[] = [];

  // Create directories
  const dirs = ["inbox", "findings", "log", "state", "skills"];
  for (const dir of dirs) {
    await mkdir(join(base, dir), { recursive: true });
  }

  // Create scaffold files (never overwrite)
  const files: ScaffoldFile[] = [
    { path: "protocol.md", content: PROTOCOL_CONTENT },
    { path: "config.yaml", content: CONFIG_CONTENT },
    { path: "schedule.md", content: SCHEDULE_CONTENT },
    { path: "invariants.md", content: INVARIANTS_TEMPLATE },
    { path: "skills/implement.md", content: IMPLEMENT_SKILL },
    { path: "skills/fix-tests.md", content: FIX_TESTS_SKILL },
    { path: "skills/test-coverage.md", content: TEST_COVERAGE_SKILL },
    { path: "skills/doc-sync.md", content: DOC_SYNC_SKILL },
    { path: "skills/health.md", content: HEALTH_SKILL },
    { path: "skills/octoclean-fix.md", content: OCTOCLEAN_FIX_SKILL },
    { path: "skills/bug-fix.md", content: BUG_FIX_SKILL },
    { path: "skills/dead-code.md", content: DEAD_CODE_SKILL },
    { path: "skills/dependency-update.md", content: DEPENDENCY_UPDATE_SKILL },
  ];

  for (const file of files) {
    const fullPath = join(base, file.path);
    if (await fileExists(fullPath)) {
      skipped.push(file.path);
    } else {
      await writeFile(fullPath, file.content);
      created.push(file.path);
    }
  }

  return { created, skipped };
}

export interface BootstrapResult {
  imported: string[];
  skipped: string[];
}

/**
 * Extract a title from a markdown file.
 * Uses the first H1 heading, or falls back to the filename.
 */
function extractTitle(content: string, filename: string): string {
  const h1 = content.match(/^#\s+(.+)/m);
  return h1 ? h1[1].trim() : filename.replace(/\.md$/, "");
}

/**
 * Wrap raw markdown content with OctoWiki frontmatter.
 */
function wrapWithFrontmatter(content: string, title: string): string {
  return `---
title: ${title}
category: imported
tags: [imported, bootstrap]
summary: Imported from existing project documentation.
---

${content}`;
}

/**
 * Bootstrap wiki pages from existing documentation in the repo.
 *
 * Scans for:
 * - README.md in the repo root
 * - Markdown files in docs/ directory
 *
 * Creates wiki pages with frontmatter. Does not overwrite existing pages.
 */
export async function bootstrapWiki(
  repoRoot: string,
  wikiDir: string = "wiki"
): Promise<BootstrapResult> {
  const pagesDir = join(repoRoot, wikiDir, "pages");
  await mkdir(pagesDir, { recursive: true });

  const imported: string[] = [];
  const skipped: string[] = [];

  // Collect source docs: README.md + docs/*.md
  const sources: { sourcePath: string; wikiName: string }[] = [];

  // Check for README.md
  const readmePath = join(repoRoot, "README.md");
  if (await fileExists(readmePath)) {
    sources.push({ sourcePath: readmePath, wikiName: "readme.md" });
  }

  // Check for docs/ directory
  const docsDir = join(repoRoot, "docs");
  try {
    const files = await readdir(docsDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      sources.push({
        sourcePath: join(docsDir, file),
        wikiName: file.toLowerCase(),
      });
    }
  } catch {
    // docs/ may not exist
  }

  // Import each source
  for (const { sourcePath, wikiName } of sources) {
    const destPath = join(pagesDir, wikiName);
    if (await fileExists(destPath)) {
      skipped.push(wikiName);
      continue;
    }

    const content = await readFile(sourcePath, "utf-8");
    const title = extractTitle(content, wikiName);
    const wikiContent = wrapWithFrontmatter(content, title);
    await writeFile(destPath, wikiContent);
    imported.push(wikiName);
  }

  return { imported, skipped };
}
