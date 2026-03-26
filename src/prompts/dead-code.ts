import { OFF_LIMITS } from "./helpers";

export function buildDeadCodePrompt(skillSection: string): string {
  return `# Remove Dead Code

A work item in \`.shoe-makers/state/work-item.md\` describes dead code to remove. Read it and follow the instructions.

1. Read \`.shoe-makers/state/work-item.md\`
2. Verify each candidate is truly dead — grep for all references
3. Remove the dead code (source files AND their stale test files)
4. Run \`bun test\` to confirm nothing depended on the removed code
5. Commit your changes
6. Delete \`.shoe-makers/state/work-item.md\`

You ARE permitted to delete test files that test removed features.${skillSection}${OFF_LIMITS}`;
}
