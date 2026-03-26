import type { WorldState } from "../types";
import { OFF_LIMITS } from "./helpers";

export function buildFixTestsPrompt(skillSection: string): string {
  return `# Fix Failing Tests

Tests are failing. This is the highest priority — fix them before doing anything else.

Run \`bun test\` to see the failures. Fix them. Run \`bun test\` again to confirm. Commit.${skillSection}${OFF_LIMITS}`;
}

export function buildFixCritiquePrompt(): string {
  return `# Fix Unresolved Critiques

A previous elf's adversarial review found issues that haven't been resolved yet. Fix them before doing new work.

Read the critique findings in \`.shoe-makers/findings/\` (files starting with \`critique-\`). For each unresolved critique:
1. Read the critique carefully
2. Fix the issues it identifies
3. Run \`bun test\` to confirm nothing is broken
4. Add \`## Status\\n\\nResolved.\` to the bottom of the critique finding file
5. Commit your fixes

Do NOT delete the critique files — mark them as resolved so the review trail is preserved.${OFF_LIMITS}`;
}

export function buildCritiquePrompt(permissionViolations?: string[], validationPatterns?: string[]): string {
  const violationWarning = permissionViolations && permissionViolations.length > 0
    ? `\n\n**⚠ PERMISSION VIOLATIONS DETECTED:**\nThe previous elf modified files outside their permitted scope:\n${permissionViolations.map(f => `- \`${f}\``).join("\n")}\n\nThis is a serious issue. Include it prominently in your critique.\n`
    : "";

  const validationSection = validationPatterns && validationPatterns.length > 0
    ? `\n\n## Validation patterns to check\n\nThe previous elf's skill requires that output matches these patterns:\n${validationPatterns.map(p => `- \`${p}\``).join("\n")}\n\nCheck whether the elf's work satisfies these validation requirements.\n`
    : "";

  return `# Adversarial Review — Critique Previous Elf's Work

There are commits since the last review that need adversarial scrutiny. You are the reviewer, not the author.${violationWarning}${validationSection}

1. Read \`.shoe-makers/state/last-action.md\` to understand what rules the previous elf was given
2. Read \`.shoe-makers/state/last-reviewed-commit\` to find the last reviewed commit hash
3. Run \`git log <last-reviewed-commit>..HEAD --oneline\` to see what was done
4. Run \`git diff <last-reviewed-commit>..HEAD\` to see the actual changes
5. Review against these 5 criteria (from the verification spec):
   1. Did the elf stay within its permitted files?
   2. Does the code correctly implement what was asked?
   3. Do the tests actually verify the behaviour, or are they trivial?
   4. Were any invariants or evidence patterns modified to game the system?
   5. Does the change match the wiki spec?
6. Write your critique to \`.shoe-makers/findings/critique-{YYYY-MM-DD}-{NNN}.md\` where NNN is a sequence number
7. Commit your critique
8. Update \`.shoe-makers/state/last-reviewed-commit\` to the current HEAD commit hash (this file is gitignored — just write it to disk, don't try to commit it)

**Verdict format**: State "Compliant" or "Non-compliant" for each criterion. For any non-compliant item, cite specific file paths and line numbers so the fixer elf can verify. If the work is correct and compliant, write a brief "Clean" verdict and mark the critique as Resolved. Not every review must find problems.

**Off-limits — do NOT modify these files:**
- \`.shoe-makers/invariants.md\` — only humans maintain the spec claims
- Any file in \`src/\`, \`wiki/\`, or tests — reviewers can only write findings`;
}

export function buildReviewPrompt(): string {
  return `# Review Uncommitted Work

There are uncommitted changes on the branch. Review them before committing.

Run \`git diff\` to see the changes. Check against these criteria:
1. Does the code correctly implement what was asked?
2. Are there tests for the changes, and do they verify actual behaviour?
3. Does the change match the wiki spec?

If the changes are good, commit them with a descriptive message. If not, fix the issues first.${OFF_LIMITS}`;
}

export function buildContinueWorkPrompt(): string {
  return `# Continue Partial Work

A previous elf started work but didn't finish. Resume where they left off.

1. Read \`.shoe-makers/state/partial-work.md\` to understand what was done and what remains
2. Read the relevant source files referenced in the partial work description
3. Continue the work described
4. Run \`bun test\` to confirm nothing is broken
5. Commit your work
6. If you finish, delete \`.shoe-makers/state/partial-work.md\`
7. If you can't finish either, update partial-work.md with your progress${OFF_LIMITS}`;
}

export function buildInboxPrompt(state: WorldState): string {
  return `# Inbox Messages

There are ${state.inboxCount} message(s) in \`.shoe-makers/inbox/\`. Read them, do what they ask, commit your work, then delete the message files.${OFF_LIMITS}`;
}
