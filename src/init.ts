import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileExists } from "./utils/fs";

export interface InitResult {
  created: string[];
  skipped: string[];
}

interface ManifestFile {
  source: string;
  target: string;
  mode?: string;
}
interface Manifest {
  name: string;
  version: string;
  description?: string;
  files: ManifestFile[];
}

/**
 * Resolve the canonical bundle directory shipped with this package.
 * Works whether shoe-makers is invoked from its source repo or from
 * `node_modules/shoe-makers/` in a consuming project.
 */
function resolveBundleDir(): string {
  return resolve(import.meta.dir, "..", "bundle");
}

/**
 * Parse a tiny subset of YAML — just enough for this manifest. Only handles
 * top-level scalars and a `files:` list of objects with scalar values. Avoids
 * adding a YAML dep to shoe-makers.
 */
function parseManifest(yamlText: string): Manifest {
  const lines = yamlText.split("\n");
  const top: Record<string, string> = {};
  const files: ManifestFile[] = [];
  let current: ManifestFile | null = null;
  let inFiles = false;

  for (let raw of lines) {
    if (raw.trim().startsWith("#") || raw.trim() === "") continue;
    if (raw.startsWith("files:")) {
      inFiles = true;
      continue;
    }
    if (inFiles) {
      const itemMatch = raw.match(/^\s*-\s*source:\s*(.+?)\s*$/);
      if (itemMatch) {
        if (current) files.push(current);
        current = { source: itemMatch[1]!, target: "" };
        continue;
      }
      const propMatch = raw.match(/^\s+(target|mode):\s*(.+?)\s*$/);
      if (propMatch && current) {
        const [, key, value] = propMatch;
        if (key === "target") current.target = value!;
        else if (key === "mode") current.mode = value!.replace(/^["']|["']$/g, "");
        continue;
      }
      // top-level scalar after files:; rare, but handle safely
      const topMatch = raw.match(/^([a-z_-]+):\s*(.+?)\s*$/i);
      if (topMatch && !raw.startsWith(" ")) {
        if (current) files.push(current);
        current = null;
        inFiles = false;
        top[topMatch[1]!] = topMatch[2]!;
      }
    } else {
      const topMatch = raw.match(/^([a-z_-]+):\s*(.*?)\s*$/i);
      if (topMatch && !raw.startsWith(" ")) {
        top[topMatch[1]!] = topMatch[2]!.replace(/^["']|["']$/g, "");
      }
    }
  }
  if (current) files.push(current);

  return {
    name: top.name ?? "shoe-makers",
    version: top.version ?? "0.0.0",
    description: top.description,
    files,
  };
}

async function loadManifest(bundleDir: string): Promise<Manifest> {
  const path = join(bundleDir, "manifest.yaml");
  const text = await readFile(path, "utf8");
  return parseManifest(text);
}

/**
 * Scaffold .shoe-makers/ directory structure in a repository from the
 * canonical bundle. Does not overwrite existing files — safe to run multiple
 * times. For a drift-aware install/update lifecycle, use the meta hub
 * `bundle` CLI against this same bundle directory.
 */
export async function init(repoRoot: string): Promise<InitResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  const bundleDir = resolveBundleDir();
  const manifest = await loadManifest(bundleDir);

  // Always create runtime directories that the elf needs but the bundle
  // doesn't ship (state, logs, inbox, findings).
  for (const dir of ["inbox", "findings", "log", "state", "skills"]) {
    await mkdir(join(repoRoot, ".shoe-makers", dir), { recursive: true });
  }

  for (const file of manifest.files) {
    const src = join(bundleDir, file.source);
    const dst = join(repoRoot, file.target);
    await mkdir(dirname(dst), { recursive: true });
    if (await fileExists(dst)) {
      skipped.push(file.target);
      continue;
    }
    await copyFile(src, dst);
    created.push(file.target);
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
  return h1 ? h1[1]!.trim() : filename.replace(/\.md$/, "");
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
