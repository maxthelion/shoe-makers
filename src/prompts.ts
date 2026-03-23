import type { ActionType, WorldState } from "./types";
import type { SkillDefinition } from "./skills/registry";

/** Off-limits notice appended to all non-critique prompts */
const OFF_LIMITS = `

**Off-limits — do NOT modify these files:**
- \`.shoe-makers/invariants.md\` — only humans maintain the spec claims
- \`.shoe-makers/state/\` — managed by the scheduler, not agents (except candidates.md and work-item.md which you write as part of the three-phase cycle)`;

/** Maps action types to skill mapsTo values for work actions */
export const ACTION_TO_SKILL_TYPE: Partial<Record<ActionType, string>> = {
  "fix-tests": "fix",
  "execute-work-item": "implement",
  "dead-code": "dead-code",
};

/**
 * Find the skill that matches a given action type.
 */
function findSkillForAction(
  action: ActionType,
  skills?: Map<string, SkillDefinition>,
): SkillDefinition | undefined {
  if (!skills || skills.size === 0) return undefined;
  const skillType = ACTION_TO_SKILL_TYPE[action];
  if (!skillType) return undefined;
  for (const skill of skills.values()) {
    if (skill.mapsTo === skillType) return skill;
  }
  return undefined;
}

/**
 * Format skill content as a clearly marked section to append to prompts.
 */
function formatSkillSection(skill: SkillDefinition): string {
  return `\n\n## Skill: ${skill.name}\n\n${skill.body}`;
}

/**
 * Generate a focused prompt for the elf based on the tree's decision.
 *
 * Each action produces a scoped prompt telling the elf exactly what to do.
 * This is the interface between the deterministic tree and the elf's intelligence.
 */
export function generatePrompt(
  action: ActionType,
  state: WorldState,
  skills?: Map<string, SkillDefinition>,
  article?: { title: string; summary: string },
): string {
  const skill = findSkillForAction(action, skills);
  const skillSection = skill ? formatSkillSection(skill) : "";

  switch (action) {
    case "fix-tests":
      return `# Fix Failing Tests

Tests are failing. This is the highest priority — fix them before doing anything else.

Run \`bun test\` to see the failures. Fix them. Run \`bun test\` again to confirm. Commit.${skillSection}${OFF_LIMITS}`;

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

1. Read \`.shoe-makers/state/last-action.md\` to understand what rules the previous elf was given
2. Read \`.shoe-makers/state/last-reviewed-commit\` to find the last reviewed commit hash
3. Run \`git log <last-reviewed-commit>..HEAD --oneline\` to see what was done
4. Run \`git diff <last-reviewed-commit>..HEAD\` to see the actual changes
5. Review adversarially — check compliance with the rules in last-action.md, and look for:
   - Bugs, logic errors, off-by-ones
   - Tests that don't actually test what they claim
   - Evidence patterns that are too loose (e.g. checking a word exists rather than verifying behaviour)
   - Spec misalignment — does the code match the wiki?
   - Architectural violations — pure function agents doing side effects, etc.
   - Cheating — writing tests/evidence designed to pass rather than to verify
6. Write your critique to \`.shoe-makers/findings/critique-{YYYY-MM-DD}-{NNN}.md\` where NNN is a sequence number
7. Commit your critique
8. Update \`.shoe-makers/state/last-reviewed-commit\` to the current HEAD commit hash (this file is gitignored — just write it to disk, don't try to commit it)

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

    case "execute-work-item":
      return `# Execute Work Item

A previous elf wrote a detailed work item in \`.shoe-makers/state/work-item.md\`. Read it and do exactly what it says.

1. Read \`.shoe-makers/state/work-item.md\`
2. Do the work described — implement, test, or fix as instructed
3. Run \`bun test\` to confirm nothing is broken
4. Commit your work
5. Delete \`.shoe-makers/state/work-item.md\` (the work is done)
6. Optionally, write a new \`.shoe-makers/state/work-item.md\` as a follow-up for the next elf (e.g. "review what I just built" or "write tests for this feature")

The work-item contains specific, detailed instructions with full context. Follow them precisely.

When wiki and code diverge, check which changed more recently. If the wiki is newer, change code to match — never revert the wiki. The wiki is always the source of truth.${skillSection}${OFF_LIMITS}`;

    case "dead-code":
      return `# Remove Dead Code

A work item in \`.shoe-makers/state/work-item.md\` describes dead code to remove. Read it and follow the instructions.

1. Read \`.shoe-makers/state/work-item.md\`
2. Verify each candidate is truly dead — grep for all references
3. Remove the dead code (source files AND their stale test files)
4. Run \`bun test\` to confirm nothing depended on the removed code
5. Commit your changes
6. Delete \`.shoe-makers/state/work-item.md\`

You ARE permitted to delete test files that test removed features.${skillSection}${OFF_LIMITS}`;

    case "prioritise":
      return `# Prioritise — Pick a Work Item

A previous elf explored the codebase and wrote a candidate list in \`.shoe-makers/state/candidates.md\`. Your job is to pick the most impactful candidate and write a detailed work item.

1. Read \`.shoe-makers/state/candidates.md\`
2. For the top candidates, read the relevant wiki pages and source files to understand the context
3. Read \`.shoe-makers/insights/\` — for each insight, decide:
   - **Promote**: worth doing now → include as a candidate in your ranking
   - **Defer**: interesting but not a priority → leave it for a future elf
   - **Dismiss**: not applicable → delete it and note why in the shift log
4. Pick ONE candidate — the most impactful, highest-confidence, lowest-risk option
5. Write \`.shoe-makers/state/work-item.md\` with:
   - A clear title
   - If the work maps to a specific skill type (e.g. dead-code, implement, fix), add \`skill-type: <type>\` on a line by itself near the top
   - The relevant wiki text (quote it)
   - The relevant code (reference files and line numbers)
   - Exactly what to build or change
   - Which patterns to follow
   - What tests to write
   - What NOT to change
6. Delete \`.shoe-makers/state/candidates.md\` (it's been consumed)
7. Commit both changes

Your job is to write a really good, specific prompt for the executor elf. Not "implement something from the wiki" but "the wiki says X, the code has Y, build Z in this file following this pattern."${OFF_LIMITS}`;

    case "explore": {
      const lensSection = article ? `

## Creative Lens

A random concept for analogical thinking:

**${article.title}**

${article.summary}

If anything about this concept reminds you of a pattern, approach, or problem in the shoe-makers codebase, write an insight to \`.shoe-makers/insights/YYYY-MM-DD-NNN.md\` with:
- The Wikipedia article that prompted it
- The connection to the codebase
- A concrete proposal for what could change
- Why it would be better than the current approach

If no connection, move on — most creative prompts yield nothing, and that's fine.` : "";

      return `# Explore — Survey and Write Candidates

Nothing is queued for work. Your job is to survey the entire codebase and produce a ranked candidate list.

1. Read wiki pages in \`wiki/pages/\` — what does the spec say should exist?
2. Read \`.shoe-makers/invariants.md\` — are there gaps?
3. Read the code in \`src/\` — what's built, what's missing?
4. Read findings in \`.shoe-makers/findings/\` — any open issues?
5. Check test coverage — untested paths?
6. Check code quality — files too complex or duplicated?
7. Check whether \`README.md\` accurately describes current capabilities — flag any drift as a candidate

Write \`.shoe-makers/state/candidates.md\` with a ranked list of possible work items:

\`\`\`markdown
# Candidates

## 1. [Title]
**Type**: implement | test | fix | health | doc-sync
**Impact**: high | medium | low
**Confidence**: high | medium | low
**Risk**: high | medium | low
**Reasoning**: Why this matters, what wiki page specifies it, what code is affected.

## 2. [Title]
...
\`\`\`

Include 3-5 candidates, ranked by impact. Be specific — reference file paths, wiki pages, and invariant IDs.

Commit \`candidates.md\` when done.

If you discover a creative insight — a non-obvious connection or a fundamentally better approach — write it to \`.shoe-makers/insights/YYYY-MM-DD-NNN.md\`. Insights are different from findings: they're proposals, not problems.

If you find code that works but has no matching invariant in \`.shoe-makers/invariants.md\`, write a finding suggesting a new invariant for the human to review.${lensSection}${OFF_LIMITS}`;
    }
  }
}
