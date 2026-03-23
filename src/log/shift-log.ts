import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { ShiftSummary } from "./shift-summary";

const LOG_DIR = ".shoe-makers/log";

/**
 * Get today's date in YYYY-MM-DD format.
 */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Format a timestamp for log entries (HH:MM UTC).
 */
function timeStamp(): string {
  const now = new Date();
  return `${now.getUTCHours().toString().padStart(2, "0")}:${now.getUTCMinutes().toString().padStart(2, "0")} UTC`;
}

/**
 * Append an entry to today's shift log.
 *
 * Creates the log file with a header if it doesn't exist,
 * then appends the entry with a timestamp.
 */
export async function appendToShiftLog(
  repoRoot: string,
  entry: string
): Promise<void> {
  const dir = join(repoRoot, LOG_DIR);
  await mkdir(dir, { recursive: true });

  const filename = `${today()}.md`;
  const filepath = join(dir, filename);

  let existing = "";
  try {
    existing = await readFile(filepath, "utf-8");
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      existing = `# Shift Log — ${today()}\n`;
    } else {
      throw err;
    }
  }

  // Deduplicate consecutive identical entries
  const lastEntryMatch = existing.match(/\n## [^\n]+ — Tick\n\n([\s\S]*?)(?=\n## |\n*$)/g);
  if (lastEntryMatch) {
    const lastEntry = lastEntryMatch[lastEntryMatch.length - 1];
    const lastContent = lastEntry.replace(/\n## [^\n]+ — Tick\n\n/, "").trim();
    if (lastContent === entry.trim()) {
      return; // Skip duplicate consecutive entry
    }
  }

  const logEntry = `\n## ${timeStamp()} — Tick\n\n${entry}\n`;
  await writeFile(filepath, existing + logEntry, "utf-8");
}

/**
 * Build a log entry from a tick result.
 */
export function formatTickLog(opts: {
  branch: string;
  tickType: string | null;
  skill: string | null;
  result: string | null;
  error: string | null;
  suggestions?: string[];
  trace?: string;
}): string {
  const lines: string[] = [];

  lines.push(`- **Branch**: ${opts.branch}`);

  if (opts.tickType) {
    lines.push(`- **Decision**: ${opts.tickType} (skill: ${opts.skill})`);
  } else {
    lines.push("- **Decision**: sleep (nothing to do)");
  }

  if (opts.trace) {
    lines.push(`- **Tree trace**:\n${opts.trace}`);
  }

  if (opts.result) {
    lines.push(`- **Result**: ${opts.result}`);
  }

  if (opts.error) {
    lines.push(`- **Error**: ${opts.error}`);
  }

  if (opts.suggestions && opts.suggestions.length > 0) {
    lines.push(`- **Suggestions**:`);
    for (const suggestion of opts.suggestions) {
      lines.push(`  - ${suggestion}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format a dashboard blockquote for the top of the shift log.
 */
export function formatDashboard(summary: ShiftSummary): string {
  const errorText = summary.errorCount === 1 ? "error" : "errors";
  const balance = summary.isBalanced ? "Balanced" : `Focused on ${summary.categories[0] || "none"}`;
  const cats = summary.categories.length > 0 ? summary.categories.join(", ") : "none";
  const line1 = `> **Shift Dashboard** | ${summary.totalActions} actions, ${summary.successCount} success, ${summary.errorCount} ${errorText} | Categories: ${cats} | ${balance}`;
  const line2 = `> ${summary.description}`;
  return line1 + "\n" + line2;
}

const DASHBOARD_PATTERN = /\n> \*\*Shift Dashboard\*\*[^\n]*\n> [^\n]*/g;

/**
 * Prepend a dashboard block to today's shift log, right after the header.
 * Idempotent — replaces any existing dashboard block.
 */
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
  const cleaned = body.replace(DASHBOARD_PATTERN, "");

  await writeFile(filepath, header + "\n" + dashboard + cleaned, "utf-8");
}

/**
 * Format a shift summary as a markdown block for the shift log.
 */
export function formatShiftSummary(summary: ShiftSummary): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push("");
  lines.push("## Shift Summary");
  lines.push("");
  lines.push(`- **Actions**: ${summary.totalActions} (${summary.successCount} success, ${summary.errorCount} ${summary.errorCount === 1 ? "error" : "errors"})`);
  lines.push(`- **Categories**: ${summary.categories.length > 0 ? summary.categories.join(", ") : "none"}`);
  lines.push(`- **Balance**: ${summary.isBalanced ? "balanced" : "focused on " + (summary.categories[0] || "none")}`);
  lines.push(`- ${summary.description}`);
  return lines.join("\n");
}
