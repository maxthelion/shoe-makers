import type { ShiftStep } from "../scheduler/shift";

/** Category of improvement work */
export type ImprovementCategory = "fix" | "feature" | "test" | "docs" | "health" | "review";

/** Summary of a shift's work across categories */
export interface ShiftSummary {
  /** Distinct improvement categories touched during the shift */
  categories: ImprovementCategory[];
  /** Whether improvements span multiple categories (genuine balance) */
  isBalanced: boolean;
  /** Total non-explore actions taken */
  totalActions: number;
  /** Actions that completed successfully */
  successCount: number;
  /** Actions that failed */
  errorCount: number;
  /** Human-readable description of what the shift covered */
  description: string;
}

/** Map action types to improvement categories */
const ACTION_TO_CATEGORY: Record<string, ImprovementCategory> = {
  "fix-tests": "fix",
  "fix-critique": "fix",
  "dead-code": "fix",
  "execute-work-item": "feature",
  "prioritise": "feature",
  "critique": "review",
  "review": "review",
  "inbox": "feature",
};

/**
 * Summarize a shift's steps into improvement categories.
 *
 * Tracks which categories of work were done (fix, feature, test, docs, health, review),
 * whether the shift produced balanced improvements across multiple categories,
 * and basic success/error counts.
 *
 * Explore actions are excluded from category tracking since they're
 * assessment-only and don't produce improvements.
 */
export function summarizeShift(steps: ShiftStep[]): ShiftSummary {
  const categorySet = new Set<ImprovementCategory>();
  let successCount = 0;
  let errorCount = 0;
  let totalActions = 0;

  for (const step of steps) {
    const action = step.tick.action;
    if (!action || action === "explore") continue;

    totalActions++;

    if (step.error) {
      errorCount++;
    } else {
      successCount++;
    }

    const category = ACTION_TO_CATEGORY[action];
    if (category) {
      categorySet.add(category);
    }
  }

  const categories = [...categorySet];
  const isBalanced = categories.length >= 2;
  const description = categories.length > 0
    ? `Improvements across ${categories.length} categories: ${categories.join(", ")}`
    : "No improvement actions taken";

  return {
    categories,
    isBalanced,
    totalActions,
    successCount,
    errorCount,
    description,
  };
}
