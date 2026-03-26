import { OFF_LIMITS } from "./helpers";

export function buildFixTestsPrompt(skillSection: string): string {
  return `# Fix Failing Tests

Tests are failing. This is the highest priority — fix them before doing anything else.

Run \`bun test\` to see the failures. Fix them. Run \`bun test\` again to confirm. Commit.${skillSection}${OFF_LIMITS}`;
}
