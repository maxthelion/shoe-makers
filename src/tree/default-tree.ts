import type { TreeNode } from "../types";

/**
 * The default behaviour tree.
 *
 * Selector: try each branch in priority order, first match wins.
 * Each branch is a sequence: condition check → action.
 *
 * Priority order:
 * 1. Fix failing tests (branch health)
 * 2. Continue unfinished work (branch health)
 * 3. Close open plans (human intent)
 * 4. Implement specified-only invariants (spec → code)
 * 5. Add tests for untested invariants (code → tests)
 * 6. Document unspecified code (code → spec)
 * 7. Improve code health (quality)
 */
export const defaultTree: TreeNode = {
  type: "selector",
  name: "root",
  children: [
    {
      type: "sequence",
      name: "fix-failing-tests",
      children: [
        {
          type: "condition",
          name: "tests-failing",
          condition: {
            name: "tests-failing",
            check: (state) => state.testsPass === false,
          },
        },
        { type: "action", name: "fix", skill: "fix" },
      ],
    },
    {
      type: "sequence",
      name: "continue-unfinished",
      children: [
        {
          type: "condition",
          name: "has-uncommitted-changes",
          condition: {
            name: "has-uncommitted-changes",
            check: (state) => state.hasUncommittedChanges,
          },
        },
        { type: "action", name: "continue", skill: "continue" },
      ],
    },
    {
      type: "sequence",
      name: "close-plans",
      children: [
        {
          type: "condition",
          name: "has-open-plans",
          condition: {
            name: "has-open-plans",
            check: (state) => state.openPlans.length > 0,
          },
        },
        { type: "action", name: "implement-plan", skill: "implement-plan" },
      ],
    },
    {
      type: "sequence",
      name: "implement-spec",
      children: [
        {
          type: "condition",
          name: "has-specified-only",
          condition: {
            name: "has-specified-only",
            check: (state) =>
              (state.invariants?.specifiedOnly ?? 0) > 0,
          },
        },
        { type: "action", name: "implement", skill: "implement" },
      ],
    },
    {
      type: "sequence",
      name: "add-tests",
      children: [
        {
          type: "condition",
          name: "has-untested",
          condition: {
            name: "has-untested",
            check: (state) =>
              (state.invariants?.implementedUntested ?? 0) > 0,
          },
        },
        { type: "action", name: "test", skill: "test-coverage" },
      ],
    },
    {
      type: "sequence",
      name: "sync-docs",
      children: [
        {
          type: "condition",
          name: "has-unspecified",
          condition: {
            name: "has-unspecified",
            check: (state) =>
              (state.invariants?.unspecified ?? 0) > 0,
          },
        },
        { type: "action", name: "doc-sync", skill: "doc-sync" },
      ],
    },
    {
      type: "sequence",
      name: "improve-health",
      children: [
        {
          type: "condition",
          name: "health-below-threshold",
          condition: {
            name: "health-below-threshold",
            check: (state) =>
              state.healthScore !== null && state.healthScore < 70,
          },
        },
        { type: "action", name: "clean", skill: "octoclean-fix" },
      ],
    },
  ],
};
