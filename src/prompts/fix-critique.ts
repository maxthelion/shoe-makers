import { OFF_LIMITS } from "./helpers";

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
