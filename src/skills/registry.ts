import { readdir } from "fs/promises";
import { join } from "path";
import type { Skill } from "../types";
import { parseFrontmatter } from "../utils/frontmatter";

/** Extended skill definition with fields from the markdown file */
export interface SkillDefinition extends Skill {
  /** Source filename of the skill definition */
  filename?: string;
  /** Which priority item type this skill handles */
  mapsTo: string;
  /** Full markdown body (instructions, verification, etc.) */
  body: string;
  /** Off-limits items parsed from the ## Off-limits section */
  offLimits: string[];
}

/**
 * Parse a skill markdown file into a SkillDefinition.
 *
 * Expected format:
 * ---
 * name: skill-name
 * description: What the skill does
 * maps-to: priority-item-type
 * risk: low|medium|high
 * ---
 * (markdown body with instructions, verification criteria, etc.)
 */
export function parseSkillFile(content: string): SkillDefinition {
  const result = parseFrontmatter(content);
  if (!result) {
    throw new Error("Skill file must have YAML frontmatter");
  }

  const { frontmatter, body } = result;
  const fields: Record<string, string> = {};

  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^(\S+):\s*(.+)$/);
    if (match) {
      fields[match[1]] = match[2].trim();
    }
  }

  const name = fields["name"];
  const description = fields["description"];
  const mapsTo = fields["maps-to"];
  const risk = fields["risk"] as Skill["risk"];

  if (!name) throw new Error("Skill file missing 'name' in frontmatter");
  if (!description) throw new Error("Skill file missing 'description' in frontmatter");
  if (!mapsTo) throw new Error("Skill file missing 'maps-to' in frontmatter");
  if (!risk || !["low", "medium", "high"].includes(risk)) {
    throw new Error("Skill file missing or invalid 'risk' in frontmatter (must be low/medium/high)");
  }

  return {
    name,
    description,
    prompt: body.trim(),
    risk,
    mapsTo,
    body: body.trim(),
    offLimits: parseOffLimits(body),
  };
}

/**
 * Parse the "## Off-limits" section from a skill body.
 * Returns an array of off-limits items (bullet points).
 */
function parseOffLimits(body: string): string[] {
  const match = body.match(/## Off-limits\s*\n([\s\S]*?)(?=\n## |\n---|\s*$)/i);
  if (!match) return [];

  const items: string[] = [];
  for (const line of match[1].split("\n")) {
    const bullet = line.match(/^- (.+)/);
    if (bullet) {
      items.push(bullet[1].trim());
    }
  }
  return items;
}

/**
 * Load all skill definitions from the skills directory.
 *
 * Reads `.shoe-makers/skills/*.md` and parses each file.
 * Returns a map of skill name → SkillDefinition.
 */
export async function loadSkills(
  repoRoot: string,
  enabledSkills?: string[] | null,
): Promise<Map<string, SkillDefinition>> {
  const skillsDir = join(repoRoot, ".shoe-makers", "skills");
  const skills = new Map<string, SkillDefinition>();

  let files: string[];
  try {
    files = await readdir(skillsDir);
  } catch {
    return skills; // No skills directory — return empty map
  }

  const mdFiles = files.filter((f) => f.endsWith(".md"));

  for (const file of mdFiles) {
    const content = await Bun.file(join(skillsDir, file)).text();
    const skill = parseSkillFile(content);
    // Filter by enabledSkills if configured (null = all enabled)
    if (enabledSkills && !enabledSkills.includes(skill.name)) continue;
    skills.set(skill.name, skill);
  }

  return skills;
}

/**
 * Find the skill that handles a given priority item type.
 *
 * Returns the first skill whose `mapsTo` matches the given type,
 * or undefined if no skill is registered for that type.
 */
export function findSkillForType(
  skills: Map<string, SkillDefinition>,
  priorityType: string,
): SkillDefinition | undefined {
  for (const skill of skills.values()) {
    if (skill.mapsTo === priorityType) {
      return skill;
    }
  }
  return undefined;
}
