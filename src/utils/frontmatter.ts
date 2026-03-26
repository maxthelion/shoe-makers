/**
 * Parse YAML frontmatter from a markdown file.
 * Returns the frontmatter string (without delimiters) and the body after frontmatter.
 * Returns null if no frontmatter found.
 */
export function parseFrontmatter(content: string): { frontmatter: string; body: string } | null {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1].replace(/\r\n/g, "\n"), body: match[2].replace(/\r\n/g, "\n") };
}

/**
 * Extract a single field value from raw frontmatter text.
 * Returns undefined if the field is not found.
 */
export function getFrontmatterField(frontmatter: string, field: string): string | undefined {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = frontmatter.match(new RegExp(`^${escaped}:\\s*(.+)$`, "m"));
  const value = match?.[1]?.trim();
  if (value === undefined) return undefined;
  return value.replace(/^["']|["']$/g, "");
}
