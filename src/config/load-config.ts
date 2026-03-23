import { readFile } from "fs/promises";
import { join } from "path";
import type { Config } from "../types";

const CONFIG_PATH = ".shoe-makers/config.yaml";

const KNOWN_KEYS = new Set([
  "branch-prefix",
  "tick-interval",
  "wiki-dir",
  "assessment-stale-after",
  "max-ticks-per-shift",
  "enabled-skills",
  "insight-frequency",
  "max-innovation-cycles",
]);

const DEFAULTS: Config = {
  branchPrefix: "shoemakers",
  tickInterval: 5,
  wikiDir: "wiki",
  assessmentStaleAfter: 30,
  maxTicksPerShift: 10,
  enabledSkills: null,
  insightFrequency: 0.3,
  maxInnovationCycles: 3,
};

/**
 * Parse a simple YAML-like config file.
 * Handles only flat key: value pairs (no nesting, no arrays).
 * This avoids adding a YAML parser dependency for a simple config.
 */
function parseSimpleYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Load config from `.shoe-makers/config.yaml`, falling back to defaults.
 *
 * The config file is optional — if missing, all defaults are used.
 * Partial configs are merged with defaults.
 */
function parseInsightFrequency(value: string | undefined): number {
  if (!value) return DEFAULTS.insightFrequency;
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
    console.warn(`[config] Invalid value for "insight-frequency": "${value}", using default ${DEFAULTS.insightFrequency}`);
    return DEFAULTS.insightFrequency;
  }
  return parsed;
}

export async function loadConfig(repoRoot: string): Promise<Config> {
  let raw: Record<string, string> = {};

  try {
    const content = await readFile(join(repoRoot, CONFIG_PATH), "utf-8");
    raw = parseSimpleYaml(content);
    for (const key of Object.keys(raw)) {
      if (!KNOWN_KEYS.has(key)) {
        console.warn(`[config] Unknown config key: "${key}"`);
      }
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return { ...DEFAULTS };
    }
    throw err;
  }

  const intOrDefault = (key: string, fallback: number) => {
    if (!raw[key]) return fallback;
    const parsed = parseInt(raw[key], 10);
    if (Number.isNaN(parsed)) {
      console.warn(`[config] Invalid value for "${key}": "${raw[key]}", using default ${fallback}`);
      return fallback;
    }
    return parsed;
  };

  return {
    branchPrefix: raw["branch-prefix"] ?? DEFAULTS.branchPrefix,
    tickInterval: intOrDefault("tick-interval", DEFAULTS.tickInterval),
    wikiDir: raw["wiki-dir"] ?? DEFAULTS.wikiDir,
    assessmentStaleAfter: intOrDefault("assessment-stale-after", DEFAULTS.assessmentStaleAfter),
    maxTicksPerShift: intOrDefault("max-ticks-per-shift", DEFAULTS.maxTicksPerShift),
    enabledSkills: raw["enabled-skills"]
      ? raw["enabled-skills"].split(",").map((s) => s.trim()).filter(Boolean)
      : null,
    insightFrequency: parseInsightFrequency(raw["insight-frequency"]),
    maxInnovationCycles: intOrDefault("max-innovation-cycles", DEFAULTS.maxInnovationCycles),
  };
}
