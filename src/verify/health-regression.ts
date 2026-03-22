/**
 * Health regression check: compare before/after health scores.
 *
 * Returns a descriptive issue string if health regressed beyond the
 * tolerance threshold, or null if health is stable/improved.
 *
 * A small tolerance (2 points) prevents flagging noise from
 * non-deterministic scanning.
 */

const REGRESSION_THRESHOLD = 2;

export function checkHealthRegression(
  before: number | null,
  after: number | null
): string | null {
  if (before === null || after === null) return null;

  const drop = before - after;
  if (drop > REGRESSION_THRESHOLD) {
    return `Code health regressed from ${before} to ${after} (dropped ${drop} points)`;
  }

  return null;
}
