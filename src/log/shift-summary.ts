import type { ShiftStep } from "../scheduler/shift";
import type { TraceEntry } from "../tree/evaluate";

/** Category of improvement work */
export type ImprovementCategory = "fix" | "feature" | "test" | "docs" | "health" | "review";

/** Analysis of tree traces across a shift */
export interface TraceAnalysis {
  /** Number of ticks handled reactively (tree depth <= 2) */
  reactive: number;
  /** Number of ticks handled at routine depth (3-4) */
  routine: number;
  /** Number of ticks that reached the explore tier (depth > 4) */
  explore: number;
  /** How many times each condition fired (was true) */
  conditionFires: Record<string, number>;
  /** Average number of conditions checked per tick */
  averageDepth: number;
}

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
  /** Analysis of tree evaluation traces, if trace data is available */
  traceAnalysis?: TraceAnalysis;
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
  const traceAnalysis = analyzeTraces(steps);
  const description = buildDescription(steps, categories, errorCount, traceAnalysis);

  return {
    categories,
    isBalanced,
    totalActions,
    successCount,
    errorCount,
    description,
    traceAnalysis,
  };
}

/** Human-readable labels for action types */
const ACTION_LABELS: Record<string, string> = {
  "fix-tests": "test fix",
  "fix-critique": "critique fix",
  "dead-code": "dead code removal",
  "execute-work-item": "feature implementation",
  "prioritise": "prioritisation",
  "critique": "review",
  "review": "review",
  "inbox": "inbox processing",
};

/** Plural forms for actions where appending "s" to the label is awkward */
const ACTION_PLURALS: Record<string, string> = {
  "inbox": "inbox tasks",
};

/**
 * Build a narrative description of the shift.
 *
 * Describes what happened in order of frequency, notes the arc
 * if trace data shows a shift from reactive to stable, and mentions errors.
 */
function buildDescription(
  steps: ShiftStep[],
  categories: ImprovementCategory[],
  errorCount: number,
  traceAnalysis?: TraceAnalysis,
): string {
  if (categories.length === 0) {
    return "No improvement actions taken";
  }

  // Count actions by type (excluding explore)
  const actionCounts: Record<string, number> = {};
  for (const step of steps) {
    const action = step.tick.action;
    if (!action || action === "explore") continue;
    actionCounts[action] = (actionCounts[action] ?? 0) + 1;
  }

  // Build action phrases sorted by count (descending)
  const phrases = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([action, count]) => {
      const label = ACTION_LABELS[action] ?? action;
      if (count === 1) return `1 ${label}`;
      const plural = ACTION_PLURALS[action] ?? `${label}s`;
      return `${count} ${plural}`;
    });

  let desc = phrases.join(", ");

  // Add arc narrative from trace analysis (check chronological order)
  if (traceAnalysis && traceAnalysis.reactive > 0 && traceAnalysis.explore > 0) {
    const depths = steps
      .filter(s => s.tick.trace && s.tick.trace.length > 0)
      .map(s => s.tick.trace!.length);
    // Find last reactive tick and first explore tick
    let lastReactiveIdx = -1;
    let firstExploreIdx = -1;
    for (let i = 0; i < depths.length; i++) {
      if (depths[i] <= 2) lastReactiveIdx = i;
      if (depths[i] > 4 && firstExploreIdx === -1) firstExploreIdx = i;
    }
    if (lastReactiveIdx < firstExploreIdx) {
      desc += " — started reactive, then stabilised";
    } else {
      desc += " — mixed reactive and explore";
    }
  }

  // Note errors
  if (errorCount === 1) {
    desc += " (1 error)";
  } else if (errorCount > 1) {
    desc += ` (${errorCount} errors)`;
  }

  return desc;
}

/**
 * Analyze tree traces from all steps in a shift.
 *
 * Returns undefined if no steps have trace data.
 * Classifies each tick by depth: reactive (1-2), routine (3-4), explore (5+).
 */
function analyzeTraces(steps: ShiftStep[]): TraceAnalysis | undefined {
  const traces: TraceEntry[][] = [];
  for (const step of steps) {
    if (step.tick.trace && step.tick.trace.length > 0) {
      traces.push(step.tick.trace);
    }
  }

  if (traces.length === 0) return undefined;

  let reactive = 0;
  let routine = 0;
  let explore = 0;
  let totalDepth = 0;
  const conditionFires: Record<string, number> = {};

  for (const trace of traces) {
    const depth = trace.length;
    totalDepth += depth;

    if (depth <= 2) {
      reactive++;
    } else if (depth <= 4) {
      routine++;
    } else {
      explore++;
    }

    for (const entry of trace) {
      if (entry.passed) {
        conditionFires[entry.condition] = (conditionFires[entry.condition] ?? 0) + 1;
      }
    }
  }

  return {
    reactive,
    routine,
    explore,
    conditionFires,
    averageDepth: totalDepth / traces.length,
  };
}
