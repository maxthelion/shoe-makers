import { readFile, readdir } from "fs/promises";
import { join } from "path";

/**
 * Evidence rule for a claim.
 */
export interface EvidenceRule {
  sourceEvidence: string[][];
  testEvidence: string[][];
}

const EVIDENCE_PATH = ".shoe-makers/claim-evidence.yaml";
const EVIDENCE_DIR = ".shoe-makers/claim-evidence";

/**
 * Parse the claim-evidence YAML file into a Record<string, EvidenceRule>.
 *
 * Format:
 *   claim-id:
 *     source:
 *       - [pattern1, pattern2]
 *     test:
 *       - [pattern1]
 */
export function parseClaimEvidenceYaml(content: string): Record<string, EvidenceRule> {
  const result: Record<string, EvidenceRule> = {};
  let currentClaim: string | null = null;
  let currentField: "source" | "test" | null = null;

  for (const line of content.split("\n")) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // Top-level claim ID (no leading whitespace, ends with colon)
    const claimMatch = line.match(/^([a-z][\w.()-]+):$/);
    if (claimMatch) {
      currentClaim = claimMatch[1];
      result[currentClaim] = { sourceEvidence: [], testEvidence: [] };
      currentField = null;
      continue;
    }

    // source: or test: field
    const fieldMatch = line.match(/^\s+(source|test):$/);
    if (fieldMatch && currentClaim) {
      currentField = fieldMatch[1] as "source" | "test";
      continue;
    }

    // Array item: - [pattern1, pattern2]
    const arrayMatch = line.match(/^\s+-\s*\[(.+)\]$/);
    if (arrayMatch && currentClaim && currentField) {
      const patterns = parsePatternList(arrayMatch[1]);
      const key = currentField === "source" ? "sourceEvidence" : "testEvidence";
      result[currentClaim][key].push(patterns);
    }
  }

  return result;
}

/**
 * Parse a comma-separated list of patterns from inside YAML brackets.
 * Handles quoted strings (single or double) and unquoted values.
 */
function parsePatternList(raw: string): string[] {
  const patterns: string[] = [];
  let i = 0;
  while (i < raw.length) {
    // Skip whitespace and commas
    while (i < raw.length && (raw[i] === " " || raw[i] === ",")) i++;
    if (i >= raw.length) break;

    if (raw[i] === '"' || raw[i] === "'") {
      const quote = raw[i];
      i++;
      let value = "";
      while (i < raw.length && raw[i] !== quote) {
        if (raw[i] === "\\" && i + 1 < raw.length) {
          i++;
          value += raw[i];
        } else {
          value += raw[i];
        }
        i++;
      }
      i++; // skip closing quote
      patterns.push(value);
    } else {
      let value = "";
      while (i < raw.length && raw[i] !== "," && raw[i] !== "]") {
        value += raw[i];
        i++;
      }
      patterns.push(value.trim());
    }
  }
  return patterns;
}

/**
 * Load claim evidence from YAML files.
 * Tries `.shoe-makers/claim-evidence/` directory first (multi-file),
 * falls back to single `.shoe-makers/claim-evidence.yaml`.
 */
export async function loadClaimEvidence(repoRoot: string): Promise<Record<string, EvidenceRule>> {
  // Try multi-file directory first
  const dirPath = join(repoRoot, EVIDENCE_DIR);
  try {
    const files = await readdir(dirPath);
    const yamlFiles = files.filter(f => f.endsWith(".yaml") || f.endsWith(".yml")).sort();
    if (yamlFiles.length > 0) {
      let combined = "";
      for (const file of yamlFiles) {
        const content = await readFile(join(dirPath, file), "utf-8");
        combined += content + "\n";
      }
      return parseClaimEvidenceYaml(combined);
    }
  } catch {}

  // Fall back to single file
  try {
    const content = await readFile(join(repoRoot, EVIDENCE_PATH), "utf-8");
    return parseClaimEvidenceYaml(content);
  } catch {
    return {};
  }
}
