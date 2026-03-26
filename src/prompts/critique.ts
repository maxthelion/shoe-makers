export interface CritiqueContext {
  commitRange: string;
  commitLog: string;
  diff: string;
  lastAction: string;
  critiqueFilename: string;
  permissionViolations?: string[];
}

export function buildCritiquePrompt(contextOrViolations?: CritiqueContext | string[]): string {
  // Support both new structured context and legacy permissionViolations-only call
  if (!contextOrViolations || Array.isArray(contextOrViolations)) {
    return buildLegacyCritiquePrompt(contextOrViolations);
  }

  const ctx = contextOrViolations;
  const violationWarning = ctx.permissionViolations && ctx.permissionViolations.length > 0
    ? `\n\n**⚠ PERMISSION VIOLATIONS DETECTED:**\nThe previous elf modified files outside their permitted scope:\n${ctx.permissionViolations.map(f => `- \`${f}\``).join("\n")}\n\nThis is a serious issue. Include it prominently in your critique.\n`
    : "";

  return `# Adversarial Review — Critique Previous Elf's Work

There are commits since the last review that need adversarial scrutiny. You are the reviewer, not the author.${violationWarning}

## Rules the previous elf was given

${ctx.lastAction}

## Commits to review (${ctx.commitRange})

\`\`\`
${ctx.commitLog}
\`\`\`

## Diff

\`\`\`diff
${ctx.diff}
\`\`\`

## Your job

Review against these 5 criteria (from the verification spec):
1. Did the elf stay within its permitted files?
2. Does the code correctly implement what was asked?
3. Do the tests actually verify the behaviour, or are they trivial?
4. Were any invariants or evidence patterns modified to game the system?
5. Does the change match the wiki spec?

Write your critique to \`.shoe-makers/findings/${ctx.critiqueFilename}\` using this exact format:

---
# Critique: [commit range]

**Reviewer**: adversarial elf
**Date**: [today's date]
**Commits reviewed**: [number] commits ([brief description])

## Summary

[YOUR JUDGEMENT HERE — brief summary of what was changed]

## Criteria

### 1. Did the elf stay within its permitted files?
**Compliant** or **Non-compliant**. [YOUR JUDGEMENT HERE]

### 2. Does the code correctly implement what was asked?
**Compliant** or **Non-compliant**. [YOUR JUDGEMENT HERE]

### 3. Do the tests actually verify the behaviour, or are they trivial?
**Compliant** or **Non-compliant**. [YOUR JUDGEMENT HERE]

### 4. Were any invariants or evidence patterns modified to game the system?
**Compliant** or **Non-compliant**. [YOUR JUDGEMENT HERE]

### 5. Does the change match the wiki spec?
**Compliant** or **Non-compliant**. [YOUR JUDGEMENT HERE]

## Verdict

[YOUR JUDGEMENT HERE — "Overall: Compliant" or list blocking issues]

## Status

Resolved.
---

The Status section must be exactly "Resolved." on its own line if no blocking issues.
If blocking issues exist, omit the Status section entirely.

After writing the critique, commit it, then update \`.shoe-makers/state/last-reviewed-commit\` to the current HEAD commit hash (this file is gitignored — just write it to disk, don't try to commit it).

**Off-limits — do NOT modify these files:**
- \`.shoe-makers/invariants.md\` — only humans maintain the spec claims
- Any file in \`src/\`, \`wiki/\`, or tests — reviewers can only write findings`;
}

function buildLegacyCritiquePrompt(permissionViolations?: string[]): string {
  const violationWarning = permissionViolations && permissionViolations.length > 0
    ? `\n\n**⚠ PERMISSION VIOLATIONS DETECTED:**\nThe previous elf modified files outside their permitted scope:\n${permissionViolations.map(f => `- \`${f}\``).join("\n")}\n\nThis is a serious issue. Include it prominently in your critique.\n`
    : "";

  return `# Adversarial Review — Critique Previous Elf's Work

There are commits since the last review that need adversarial scrutiny. You are the reviewer, not the author.${violationWarning}

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
