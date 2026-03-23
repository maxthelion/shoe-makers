# Morning Review Dashboard — Prepend shift summary to top of log

skill-type: implement

## Context

The wiki (`wiki/pages/observability.md`, lines 87-95) says:

> When the human reviews the shoemakers branch, they should be able to:
> 1. Read the shift log to understand the narrative of the night's work
> 2. Scan findings for anything that needs human decision
> 3. Review commits with full context for why they were made
> The shift log is the primary interface between the elves and the human.

Currently, `formatShiftSummary()` in `src/log/shift-log.ts:109-120` produces a flat markdown block that gets appended at the **end** of the shift log. A human opening the log sees chronological tick entries first and has to scroll to the bottom for the summary. The summary itself is minimal — just action count, categories, and a one-liner.

## What to build

Add a `prependShiftDashboard()` function to `src/log/shift-log.ts` that writes a rich summary block at the **top** of the shift log (after the `# Shift Log — DATE` header). Call it from `src/shift.ts` after the shift completes (where `formatShiftSummary` is already called, line 37-38).

### The dashboard block format

```markdown
# Shift Log — 2026-03-23

> **Shift Dashboard** | 5 actions, 4 success, 1 error | Categories: fix, feature | Balanced
> Improvements across 2 categories: fix, feature
```

This is a blockquote right after the title — visually distinct and scannable.

### Implementation details

1. **In `src/log/shift-log.ts`**, add:

```typescript
export async function prependShiftDashboard(
  repoRoot: string,
  summary: ShiftSummary,
): Promise<void> {
  const dir = join(repoRoot, LOG_DIR);
  const filename = `${today()}.md`;
  const filepath = join(dir, filename);

  let existing = "";
  try {
    existing = await readFile(filepath, "utf-8");
  } catch {
    return; // No log file = nothing to prepend to
  }

  const dashboard = formatDashboard(summary);

  // Insert after the first line (# Shift Log — DATE)
  const firstNewline = existing.indexOf("\n");
  if (firstNewline === -1) return;

  const header = existing.slice(0, firstNewline);
  const body = existing.slice(firstNewline);

  // Remove any existing dashboard block (idempotent)
  const cleaned = body.replace(/\n> \*\*Shift Dashboard\*\*[^\n]*\n(?:> [^\n]*\n)*/g, "");

  await writeFile(filepath, header + "\n\n" + dashboard + cleaned, "utf-8");
}

export function formatDashboard(summary: ShiftSummary): string {
  const errorText = summary.errorCount === 1 ? "error" : "errors";
  const balance = summary.isBalanced ? "Balanced" : `Focused on ${summary.categories[0] || "none"}`;
  const cats = summary.categories.length > 0 ? summary.categories.join(", ") : "none";
  const line1 = `> **Shift Dashboard** | ${summary.totalActions} actions, ${summary.successCount} success, ${summary.errorCount} ${errorText} | Categories: ${cats} | ${balance}`;
  const line2 = `> ${summary.description}`;
  return line1 + "\n" + line2 + "\n";
}
```

2. **In `src/shift.ts`**, after line 38 where `formatShiftSummary` is called, add:

```typescript
import { prependShiftDashboard } from "./log/shift-log";
// ... after appendToShiftLog call:
await prependShiftDashboard(repoRoot, summary);
```

### Patterns to follow

- Follow `appendToShiftLog()` pattern for file I/O (same read/write/mkdir pattern)
- Follow `formatShiftSummary()` pattern for formatting (pure function that returns string)
- Keep `formatDashboard` as a separate pure function (testable without filesystem)

### Tests to write

In `src/__tests__/shift-log.test.ts`:

1. `formatDashboard includes action counts and balance` — verify the output contains the expected blockquote format
2. `formatDashboard with zero actions` — verify it handles empty shifts
3. `prependShiftDashboard inserts after header` — write a temp file with a log, call `prependShiftDashboard`, verify dashboard appears after header line
4. `prependShiftDashboard is idempotent` — call twice, verify only one dashboard block

### What NOT to change

- Do not change `formatShiftSummary` — it still appends to the end, that's fine as a detailed record
- Do not change `appendToShiftLog` — tick entries stay chronological
- Do not change `formatTickLog` — individual tick formatting is unchanged
- Do not modify wiki pages, invariants, or `.shoe-makers/state/` (other than this work-item)
