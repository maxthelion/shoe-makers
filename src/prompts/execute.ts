import { OFF_LIMITS } from "./helpers";

export function buildExecutePrompt(skillSection: string): string {
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
}
