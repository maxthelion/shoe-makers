import { readFile } from "fs/promises";
import { join } from "path";
import { generatePrompt } from "../prompts";
import type { WorldState, ActionType } from "../types";
import type { SkillDefinition } from "../skills/registry";

export function formatAction(
  skill: string | null,
  state: WorldState,
  inboxMessages: { file: string; content: string }[],
  loadedSkills?: Map<string, SkillDefinition>,
  article?: { title: string; summary: string },
  permissionViolations?: string[],
  wikiSummary?: string,
): string {
  if (skill === "inbox" && inboxMessages.length > 0) {
    const msgs = inboxMessages
      .map((m) => `### ${m.file}\n\n${m.content}`)
      .join("\n\n---\n\n");
    return `# Inbox Messages — Act on These First

The human has left ${inboxMessages.length} message(s) for you. Read them, do what they ask, commit your work, then delete the message files from \`.shoe-makers/inbox/\`. Log what you did in the shift log.

${msgs}

## After handling inbox

Run \`bun run setup\` again to get your next action.
`;
  }

  if (skill) {
    const actionType = skill as ActionType;
    const prompt = generatePrompt(actionType, state, loadedSkills, (actionType === "explore" || actionType === "innovate") ? article : undefined, permissionViolations, wikiSummary);
    return `${prompt}

## After ${skill === "explore" ? "exploring" : "completing"}

Run \`bun run setup\` again to get your next action.
`;
  }

  return `# Nothing to Do

The tree found no applicable action. This shouldn't happen — check the tree definition.
`;
}

/**
 * Read wiki overview pages for the innovate creative brief.
 * Reads architecture.md and other key overview pages to build a system summary.
 */
export async function readWikiOverview(repoRoot: string, wikiDir: string = "wiki"): Promise<string> {
  const overviewFiles = ["architecture.md", "behaviour-tree.md", "pure-function-agents.md"];
  const sections: string[] = [];

  for (const file of overviewFiles) {
    try {
      const content = await readFile(join(repoRoot, wikiDir, "pages", file), "utf-8");
      // Strip frontmatter
      const stripped = content.replace(/^---[\s\S]*?---\n*/, "");
      sections.push(stripped.trim());
    } catch {
      // File doesn't exist — skip
    }
  }

  return sections.length > 0
    ? sections.join("\n\n---\n\n")
    : "Shoe-makers is a behaviour tree system that runs autonomous AI agents to improve codebases overnight.";
}
