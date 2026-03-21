import { readFile } from "fs/promises";
import { join } from "path";
import type { Config } from "../types";

const CONFIG_PATH = ".shoe-makers/config.yaml";

const DEFAULTS: Config = {
  branchPrefix: "shoemakers",
  tickInterval: 5,
  wikiDir: "wiki",
  assessmentStaleAfter: 30,
  maxTicksPerShift: 10,
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
export async function loadConfig(repoRoot: string): Promise<Config> {
  let raw: Record<string, string> = {};

  try {
    const content = await readFile(join(repoRoot, CONFIG_PATH), "utf-8");
    raw = parseSimpleYaml(content);
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

  return {
    branchPrefix: raw["branch-prefix"] ?? DEFAULTS.branchPrefix,
    tickInterval: raw["tick-interval"]
      ? parseInt(raw["tick-interval"], 10)
      : DEFAULTS.tickInterval,
    wikiDir: raw["wiki-dir"] ?? DEFAULTS.wikiDir,
    assessmentStaleAfter: raw["assessment-stale-after"]
      ? parseInt(raw["assessment-stale-after"], 10)
      : DEFAULTS.assessmentStaleAfter,
    maxTicksPerShift: raw["max-ticks-per-shift"]
      ? parseInt(raw["max-ticks-per-shift"], 10)
      : DEFAULTS.maxTicksPerShift,
  };
}
