import { readFileSync } from "fs";
import { join } from "path";

export interface Schedule {
  start: number;
  end: number;
}

/**
 * Parse schedule from .shoe-makers/schedule.md.
 * Returns null if no schedule file exists or parsing fails.
 */
export function parseSchedule(repoRoot: string): Schedule | null {
  try {
    const schedulePath = join(repoRoot, ".shoe-makers", "schedule.md");
    const content = readFileSync(schedulePath, "utf-8");
    const startMatch = content.match(/start:\s*(\d{1,2})/);
    const endMatch = content.match(/end:\s*(\d{1,2})/);
    if (!startMatch || !endMatch) return null;

    return {
      start: parseInt(startMatch[1], 10),
      end: parseInt(endMatch[1], 10),
    };
  } catch {
    return null;
  }
}

/**
 * Check if the current time is within configured working hours.
 * If no schedule file exists, always returns true (no restriction).
 * Accepts an optional `now` parameter for testability.
 */
export function isWithinWorkingHours(repoRoot: string, now?: Date): boolean {
  const schedule = parseSchedule(repoRoot);
  if (!schedule) return true;

  const nowHour = (now ?? new Date()).getUTCHours();
  const { start, end } = schedule;

  if (start < end) {
    return nowHour >= start && nowHour < end;
  } else {
    // Wraps midnight: e.g. start: 22, end: 6
    return nowHour >= start || nowHour < end;
  }
}

/**
 * Get the shift date — handles midnight-wrapping shifts.
 * If we're past midnight but before the shift end hour, use yesterday's date.
 * Accepts an optional `now` parameter for testability.
 */
export function getShiftDate(repoRoot: string, now?: Date): string {
  const effectiveNow = now ?? new Date();
  const nowHour = effectiveNow.getUTCHours();
  const schedule = parseSchedule(repoRoot);

  if (schedule && schedule.start > schedule.end && nowHour < schedule.end) {
    const yesterday = new Date(effectiveNow);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }

  return effectiveNow.toISOString().split("T")[0];
}
