import { OFF_LIMITS } from "./helpers";

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
