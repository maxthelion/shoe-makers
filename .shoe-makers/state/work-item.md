# Doc-sync: Update observability.md to Document Tree Trace Analysis

skill-type: doc-sync

## Context

We just added tree trace analysis to `ShiftSummary` in `src/log/shift-summary.ts`. The `TraceAnalysis` type classifies each tick by tree depth (reactive/routine/explore), tracks condition fire counts, and computes average depth. The shift dashboard and summary now include a "Tree:" line when trace data is available.

The wiki page `wiki/pages/observability.md` describes the shift log and dashboard but doesn't mention:
- Tree trace persistence in shift log entries
- The `TraceAnalysis` type and what it computes
- The "Tree:" line in the dashboard

## What to Change

Update `wiki/pages/observability.md`, specifically:

### 1. In "### 1. The Shift Log" section (around line 28-33)

After the existing bullet list of what each entry records, add a bullet:
- The behaviour tree evaluation trace (which conditions were checked and whether they passed)

### 2. After the paragraph about ShiftSummary (line 33)

Add a paragraph explaining the tree trace analysis:

> The `ShiftSummary` also includes a `TraceAnalysis` that classifies each tick by tree depth: **reactive** (depth 1-2, e.g. tests failing), **routine** (depth 3-4, e.g. critiques or work items), or **explore** (depth 5+, nothing urgent to do). This gives humans visibility into whether the system is operating healthily — a shift that's mostly reactive means things keep breaking, while a shift that's mostly explore means the codebase is stable.

### 3. In "## The Morning Review" section (around line 89)

Add a bullet point:
- Check the tree trace analysis in the dashboard to understand whether the shift was reactive (fixing problems) or proactive (exploring and improving)

### Patterns to Follow

- Keep the same markdown style and tone as the existing page
- Update the `last-modified-by` frontmatter field from `user` to `elf` since this is an elf edit
- Don't restructure the page — just add to existing sections

### Tests

No code changes, so no tests needed. Run `bun test` to confirm nothing breaks.

### What NOT to Change

- Do NOT modify source files
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify other wiki pages
- Keep it concise — add only what's needed to document the new feature
