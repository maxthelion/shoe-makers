# Write shift summary block to shift log at end of shift

skill-type: implement

## Context

`src/log/shift-summary.ts` has `summarizeShift()` which takes `ShiftStep[]` and returns a `ShiftSummary` with categories, balance, counts, and description. But this summary is never written anywhere visible.

`src/shift.ts` is the entry point for `bun run shift`. It runs the shift and prints to console but doesn't write a summary to the shift log.

The wiki (`wiki/pages/observability.md`) says: "The shift log tells a narrative, not just facts" and "The morning review should be self-contained."

## What to change

### 1. Add a `formatShiftSummary` function to `src/log/shift-log.ts`

```typescript
export function formatShiftSummary(summary: ShiftSummary): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push("");
  lines.push("## Shift Summary");
  lines.push("");
  lines.push(`- **Actions**: ${summary.totalActions} (${summary.successCount} success, ${summary.errorCount} errors)`);
  lines.push(`- **Categories**: ${summary.categories.length > 0 ? summary.categories.join(", ") : "none"}`);
  lines.push(`- **Balance**: ${summary.isBalanced ? "balanced" : "focused on " + (summary.categories[0] || "none")}`);
  lines.push(`- **${summary.description}**`);
  return lines.join("\n");
}
```

Import `ShiftSummary` from `../log/shift-summary`.

### 2. In `src/shift.ts`, after the shift completes, write the summary

After line 32 (`console.log` about shift complete), add:

```typescript
import { summarizeShift } from "./log/shift-summary";
import { appendToShiftLog, formatShiftSummary } from "./log/shift-log";

// After result is available:
const summary = summarizeShift(result.steps);
await appendToShiftLog(repoRoot, formatShiftSummary(summary));
```

### 3. Tests to write in `src/__tests__/shift-summary.test.ts`

The file already exists. Add:

```typescript
test("formatShiftSummary produces readable markdown", () => {
  // Import formatShiftSummary from shift-log
  // Create a ShiftSummary with known values
  // Check output contains "Shift Summary", action counts, categories
});
```

Also add to `src/__tests__/shift-log.test.ts`:

```typescript
test("formatShiftSummary includes action counts and categories", () => {
  const summary = { categories: ["fix", "feature"], isBalanced: true, totalActions: 5, successCount: 4, errorCount: 1, description: "Improvements across 2 categories: fix, feature" };
  const output = formatShiftSummary(summary);
  expect(output).toContain("Shift Summary");
  expect(output).toContain("5");
  expect(output).toContain("fix, feature");
  expect(output).toContain("balanced");
});
```

## Patterns to follow

- Use the existing `appendToShiftLog` for writing to the log
- Import types from their source modules
- Follow the existing markdown formatting style in `formatTickLog`

## Do NOT change

- `src/log/shift-summary.ts` — the summarize logic is already correct
- `.shoe-makers/invariants.md`
- Wiki pages
