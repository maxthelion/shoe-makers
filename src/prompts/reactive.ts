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

export function buildCritiquePrompt(permissionViolations?: string[]): string {
  const violationWarning = permissionViolations && permissionViolations.length > 0
    ? `\n\n**⚠ PERMISSION VIOLATIONS DETECTED:**\nThe previous elf modified files outside their permitted scope:\n${permissionViolations.map(f => `- \`${f}\``).join("\n")}\n\nThis is a serious issue. Include it prominently in your critique.\n`
    : "";

  return `# Adversarial Review — Critique Previous Elf's Work

There are commits since the last review that need adversarial scrutiny. You are the reviewer, not the author.${violationWarning}

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
}

export function buildReviewPrompt(): string {
  return `# Review Uncommitted Work

There are uncommitted changes on the branch. Review them adversarially before committing.

Run \`git diff\` to see the changes. Check for:
- Correctness: does the code do what it should?
- Tests: are there tests for the changes?
- Spec alignment: does this match the wiki?

If the changes are good, commit them. If not, fix the issues first.${OFF_LIMITS}`;
}

export function buildInboxPrompt(state: WorldState): string {
  return `# Inbox Messages

There are ${state.inboxCount} message(s) in \`.shoe-makers/inbox/\`. Read them, do what they ask, commit your work, then delete the message files.${OFF_LIMITS}`;
}
