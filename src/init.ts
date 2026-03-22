import { mkdir, writeFile, readFile, readdir, stat } from "fs/promises";
import { join } from "path";

export interface InitResult {
  created: string[];
  skipped: string[];
}

interface ScaffoldFile {
  path: string;
  content: string;
}

const PROTOCOL_CONTENT = `# Shoe-Makers Protocol

Read \`.shoe-makers/state/next-action.md\` and do what it says.

When you're done, run \`bun run setup\` to get your next action. Repeat until time runs out.

## Logging

After each piece of work, append to \`.shoe-makers/log/YYYY-MM-DD.md\`:
- What you attempted
- What happened
- What you committed (or why you didn't)

If you discovered something surprising or useful for future elves, create a finding in \`.shoe-makers/findings/\`.

## Self-improvement

If something would have made your job easier, add it:
- A script → package.json
- A skill prompt → \`.shoe-makers/skills/\`
- A wiki update → \`wiki/pages/\`
- A finding → \`.shoe-makers/findings/\`

## Rules

- Every change must have tests. Run \`bun test\` before committing.
- Read the wiki — it describes the intended design. Follow it.
- Small, correct changes are better than large, broken ones.
`;

const CONFIG_CONTENT = `# Shoe-makers configuration
# All values are optional — sensible defaults are used for anything not specified.

branch-prefix: shoemakers
tick-interval: 5
wiki-dir: wiki
assessment-stale-after: 30
max-ticks-per-shift: 10
`;

const SCHEDULE_CONTENT = `# Working Hours

The shoemakers only work during these hours (UTC, 24h format).

start: 20
end: 6
`;

const INVARIANTS_TEMPLATE = `# Project Invariants

Top-down. Start with what the user experiences, cascade into how it works, then architectural guarantees. Each claim is falsifiable.

---

## 1. What it does

### 1.1 Core functionality
- (Add falsifiable claims about your project here)

---

## 2. How it works

### 2.1 Architecture
- (Add architectural claims here)
`;

const IMPLEMENT_SKILL = `---
name: implement
description: Implement a feature specified in the wiki but not yet built.
maps-to: implement
risk: medium
---

## When to apply

The invariants pipeline reports \`specified-only\` items — things described in the wiki spec that have no corresponding code.

## Instructions

1. Read the relevant wiki page(s) to understand the specification.
2. Read existing source code to understand the codebase structure and conventions.
3. Identify the most foundational piece to build.
4. Write the implementation following existing patterns in the codebase.
5. Write tests that verify the behaviour described in the spec.
6. Run \`bun test\` to confirm all tests pass (both new and existing).

## Verification criteria

- New code matches the wiki specification
- Tests cover the new functionality
- \`bun test\` passes
- No existing tests broken
- Code follows existing conventions

## Permitted actions

- Create new source files in \`src/\`
- Create new test files in \`src/__tests__/\`
- Modify existing source files to wire in new functionality
- Update wiki pages if design was refined during implementation

## Off-limits

- Do not change the behaviour tree routing logic without updating the wiki
- Do not modify unrelated modules
- Do not add external dependencies without justification
`;

const FIX_TESTS_SKILL = `---
name: fix-tests
description: Fix failing tests to restore a green build.
maps-to: fix
risk: low
---

## When to apply

Tests are failing (\`bun test\` exits non-zero).

## Instructions

1. Run \`bun test\` and capture the full output.
2. Read each failing test to understand what it expects.
3. Read the source code under test to find the root cause.
4. Fix the source code (or the test, if the test is wrong — but prefer fixing source).
5. Run \`bun test\` again to confirm the fix.
6. If multiple tests fail, fix them one at a time, re-running tests after each fix.

## Verification criteria

- \`bun test\` exits 0
- No tests were deleted or skipped
- Fix addresses root cause, not symptoms

## Permitted actions

- Modify source files referenced by failing tests
- Modify test files only if the test itself is incorrect
- Add missing imports or type definitions

## Off-limits

- Do not delete or skip failing tests
- Do not modify unrelated files
- Do not change the test framework or configuration
`;

const TEST_COVERAGE_SKILL = `---
name: test-coverage
description: Add tests for implemented but untested code paths.
maps-to: test
risk: low
---

## When to apply

The invariants pipeline reports \`implemented-untested\` items — code that exists but lacks test coverage.

## Instructions

1. Identify the untested module or function.
2. Read the source code to understand its behaviour.
3. Read the relevant wiki page to understand the intended behaviour.
4. Write tests that verify both the happy path and edge cases.
5. Follow existing test patterns (see \`src/__tests__/\` for conventions).
6. Run \`bun test\` to confirm all tests pass.

## Verification criteria

- New tests exercise the previously untested code
- Tests verify behaviour described in the wiki spec
- \`bun test\` passes
- Tests are meaningful (not just "doesn't throw")

## Permitted actions

- Create new test files in \`src/__tests__/\`
- Modify existing test files to add coverage

## Off-limits

- Do not modify source code (this skill is test-only)
- Do not change test infrastructure or configuration
- Do not add tests for trivial getters/setters
`;

const DOC_SYNC_SKILL = `---
name: doc-sync
description: Sync wiki pages with code changes to keep spec accurate.
maps-to: doc-sync
risk: low
---

## When to apply

The invariants pipeline reports \`unspecified\` items — code that exists but isn't documented in the wiki. Or wiki pages are stale relative to recent code changes.

## Instructions

1. Identify what's in code but not in the wiki (or what's changed since the wiki was last updated).
2. Read the relevant source files to understand current behaviour.
3. Update the wiki page(s) to accurately reflect the implementation.
4. Preserve the wiki page's frontmatter (title, category, tags, summary).
5. Keep wiki pages factual and concise — describe what IS, not what should be.

## Verification criteria

- Updated wiki pages accurately describe the current code
- Frontmatter is preserved and correct
- No speculative content added (only document what's built)

## Permitted actions

- Modify existing wiki pages
- Create new wiki pages if a topic warrants its own page

## Off-limits

- Do not modify source code (this skill is docs-only)
- Do not remove wiki content that describes planned/future features (mark as "not yet implemented" instead)
- Do not change page categories or tags without reason
`;

const HEALTH_SKILL = `---
name: health
description: Improve code health scores by reducing complexity and duplication.
maps-to: health
risk: low
---

## When to apply

Code health score is below 70/100, indicating significant quality issues.

## Instructions

1. Identify the lowest-quality areas: high complexity, duplication, poor naming, large functions.
2. Pick one area to improve (don't try to fix everything at once).
3. Apply safe refactorings:
   - Extract helper functions from large functions
   - Consolidate duplicated logic
   - Rename unclear variables and functions
   - Split files that are too large
   - Remove dead code (zero references only)
4. Run \`bun test\` after each change to ensure nothing breaks.
5. Keep refactorings small and behaviour-preserving.

## Verification criteria

- \`bun test\` passes
- No behaviour changes (refactoring only)
- Code is measurably simpler (fewer lines per function, less duplication)

## Permitted actions

- Refactor source files in \`src/\`
- Extract new helper modules
- Remove dead code with zero references

## Off-limits

- Do not change external interfaces or APIs
- Do not add new features during health improvement
- Do not modify tests to match refactored code (tests should still pass as-is)
- Do not remove code that has callers
`;

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

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
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
