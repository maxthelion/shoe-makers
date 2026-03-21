import type { ActionType, WorldState } from "./types";

/** Off-limits notice appended to all non-critique prompts */
const OFF_LIMITS = `

**Off-limits — do NOT modify these files:**
- \`.shoe-makers/invariants.md\` — only humans maintain the spec claims
- \`.shoe-makers/state/\` — managed by the scheduler, not agents`;

/**
 * Generate a focused prompt for the elf based on the tree's decision.
 *
 * Each action produces a scoped prompt telling the elf exactly what to do.
 * This is the interface between the deterministic tree and the elf's intelligence.
 */
export function generatePrompt(action: ActionType, state: WorldState): string {
  const assessment = state.blackboard.assessment;

  switch (action) {
    case "fix-tests":
      return `# Fix Failing Tests

Tests are failing. This is the highest priority — fix them before doing anything else.

Run \`bun test\` to see the failures. Fix them. Run \`bun test\` again to confirm. Commit.${OFF_LIMITS}`;

    case "fix-critique":
      return `# Fix Unresolved Critiques

A previous elf's adversarial review found issues that haven't been resolved yet. Fix them before doing new work.

Read the critique findings in \`.shoe-makers/findings/\` (files starting with \`critique-\`). For each unresolved critique:
1. Read the critique carefully
2. Fix the issues it identifies
3. Run \`bun test\` to confirm nothing is broken
4. Add \`## Status\\n\\nResolved.\` to the bottom of the critique finding file
5. Commit your fixes

Do NOT delete the critique files — mark them as resolved so the review trail is preserved.${OFF_LIMITS}`;

    case "critique":
      return `# Adversarial Review — Critique Previous Elf's Work

There are commits since the last review that need adversarial scrutiny. You are the reviewer, not the author.

1. Read \`.shoe-makers/state/last-reviewed-commit\` to find the last reviewed commit hash
2. Run \`git log <last-reviewed-commit>..HEAD --oneline\` to see what was done
3. Run \`git diff <last-reviewed-commit>..HEAD\` to see the actual changes
4. Review adversarially — look for:
   - Bugs, logic errors, off-by-ones
   - Tests that don't actually test what they claim
   - Evidence patterns that are too loose (e.g. checking a word exists rather than verifying behaviour)
   - Spec misalignment — does the code match the wiki?
   - Architectural violations — pure function agents doing side effects, etc.
   - Cheating — writing tests/evidence designed to pass rather than to verify
5. Write your critique to \`.shoe-makers/findings/critique-{YYYY-MM-DD}-{NNN}.md\` where NNN is a sequence number
6. Update \`.shoe-makers/state/last-reviewed-commit\` to the current HEAD commit hash
7. Commit your critique and the updated marker

Be honest and thorough. If the work is good, say so briefly. If there are problems, describe them clearly.

**Off-limits — do NOT modify these files:**
- \`.shoe-makers/invariants.md\` — only humans maintain the spec claims
- Any file in \`src/\`, \`wiki/\`, or tests — reviewers can only write findings`;

    case "review":
      return `# Review Uncommitted Work

There are uncommitted changes on the branch. Review them adversarially before committing.

Run \`git diff\` to see the changes. Check for:
- Correctness: does the code do what it should?
- Tests: are there tests for the changes?
- Spec alignment: does this match the wiki?

If the changes are good, commit them. If not, fix the issues first.${OFF_LIMITS}`;

    case "inbox":
      return `# Inbox Messages

There are ${state.inboxCount} message(s) in \`.shoe-makers/inbox/\`. Read them, do what they ask, commit your work, then delete the message files.${OFF_LIMITS}`;

    case "implement-plan": {
      const plans = assessment?.openPlans ?? [];
      const planFiles = plans.map((p) => `- wiki/pages/${p}.md`);
      return `# Implement Plan

There are ${plans.length} open plan(s): ${plans.join(", ")}

Read the plan page(s):
${planFiles.join("\n")}

Pick the most impactful thing and implement it. Write tests. Run \`bun test\`. Commit.

If you complete all items in a plan, update its frontmatter to \`status: done\`.${OFF_LIMITS}`;
    }

    case "implement-spec": {
      const gaps = assessment?.invariants?.topSpecGaps ?? [];
      const gapList = gaps
        .map((g) => `- **${g.id}**: ${g.description} (group: ${g.group})`)
        .join("\n");
      return `# Implement Specified-Only Invariant — Write Tests First (TDD)

The wiki specifies ${assessment?.invariants?.specifiedOnly ?? 0} thing(s) not yet implemented. Pick the most impactful:

${gapList}

**TDD enforcement**: Write failing tests first, then implement to make them pass.

1. Read the relevant wiki page to understand the requirement
2. Write tests that verify the desired behaviour (they should fail — the feature doesn't exist yet)
3. Implement the feature to make the tests pass
4. Run \`bun test\` to confirm all tests pass
5. Commit both tests and implementation together${OFF_LIMITS}`;
    }

    case "write-tests": {
      const untested = assessment?.invariants?.topUntested ?? [];
      const list = untested
        .map((g) => `- **${g.id}**: ${g.description} (group: ${g.group})`)
        .join("\n");
      return `# Add Tests for Untested Code

There are ${assessment?.invariants?.implementedUntested ?? 0} implemented but untested invariant(s). Pick the riskiest:

${list}

Write tests that verify this behaviour. Run \`bun test\`. Commit.${OFF_LIMITS}`;
    }

    case "document": {
      const unspec = assessment?.invariants?.topUnspecified ?? [];
      const list = unspec
        .map((g) => `- **${g.id}**: ${g.description} (group: ${g.group})`)
        .join("\n");
      return `# Document Unspecified Code

There are ${assessment?.invariants?.unspecified ?? 0} thing(s) in the code not documented in the wiki:

${list}

Update or create wiki pages to document this behaviour. Commit.${OFF_LIMITS}`;
    }

    case "improve-health": {
      const worst = assessment?.worstFiles ?? [];
      const worstList = worst.length > 0
        ? "\n\nWorst files:\n" + worst.map((f) => `- \`${f.path}\` — health ${f.score}/100`).join("\n")
        : "";
      return `# Improve Code Health

Code health score is ${assessment?.healthScore ?? "unknown"}/100 (below threshold of 70).${worstList}

Pick the worst file and improve it: reduce complexity, extract helpers, remove duplication. Run \`bun test\`. Commit.${OFF_LIMITS}`;
    }

    case "explore":
      return `# Explore — Find Work

Nothing obvious needs doing. Look deeper:

1. Read wiki pages in \`wiki/pages/\` — are there claims that aren't implemented?
2. Read \`.shoe-makers/invariants.md\` — are there gaps the checker missed?
3. Read the shift log — did previous elves flag anything?
4. Read findings in \`.shoe-makers/findings/\`
5. Check test coverage — untested paths?
6. Check code quality — files too complex or duplicated?

If you find something, do it. Write tests. Commit.${OFF_LIMITS}`;
  }
}
