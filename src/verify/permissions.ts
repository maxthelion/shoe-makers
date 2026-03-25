import type { ActionType } from "../types";

/**
 * Role-based permissions for each action type.
 *
 * Each action has a role that determines which file patterns the elf
 * is allowed to write. The canWrite patterns use glob-style matching.
 * The cannotWrite patterns are always enforced regardless of canWrite.
 */
export interface RolePermissions {
  role: string;
  canWrite: string[];
  cannotWrite: string[];
}

/**
 * Files that no elf can ever modify.
 */
const ALWAYS_FORBIDDEN = [
  ".shoe-makers/invariants.md",
];

/**
 * Build the permission definitions for each action type.
 * The wikiDir parameter allows the wiki path to match the config.
 */
function buildRoleMap(wikiDir: string): Record<ActionType, RolePermissions> {
  const wikiPath = wikiDir.endsWith("/") ? wikiDir : `${wikiDir}/`;
  return {
    "fix-tests": {
      role: "test-fixer",
      canWrite: ["src/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, wikiPath],
    },
    "fix-critique": {
      role: "critique-fixer",
      canWrite: ["src/", ".shoe-makers/findings/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, wikiPath],
    },
    critique: {
      role: "reviewer",
      canWrite: [".shoe-makers/findings/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, "src/", wikiPath],
    },
    "continue-work": {
      role: "executor",
      canWrite: ["src/", wikiPath, ".shoe-makers/state/", ".shoe-makers/claim-evidence.yaml", "CHANGELOG.md", "README.md"],
      cannotWrite: [...ALWAYS_FORBIDDEN],
    },
    review: {
      role: "reviewer",
      canWrite: [".shoe-makers/findings/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, "src/", wikiPath],
    },
    inbox: {
      role: "inbox-handler",
      canWrite: ["src/", wikiPath, ".shoe-makers/"],
      cannotWrite: [...ALWAYS_FORBIDDEN],
    },
    "execute-work-item": {
      role: "executor",
      canWrite: ["src/", wikiPath, ".shoe-makers/state/", ".shoe-makers/claim-evidence.yaml", "CHANGELOG.md", "README.md"],
      cannotWrite: [...ALWAYS_FORBIDDEN],
    },
    "dead-code": {
      role: "dead-code-remover",
      canWrite: ["src/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, wikiPath],
    },
    prioritise: {
      role: "prioritiser",
      canWrite: [".shoe-makers/state/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, "src/", wikiPath],
    },
    innovate: {
      role: "innovator",
      canWrite: [".shoe-makers/insights/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, "src/", wikiPath],
    },
    "evaluate-insight": {
      role: "insight-evaluator",
      canWrite: [".shoe-makers/insights/", ".shoe-makers/state/", ".shoe-makers/log/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, "src/", wikiPath],
    },
    explore: {
      role: "explorer",
      canWrite: [".shoe-makers/state/", ".shoe-makers/findings/"],
      cannotWrite: [...ALWAYS_FORBIDDEN, "src/", wikiPath],
    },
  };
}

/** Default role map for backward compatibility */
const DEFAULT_ROLE_MAP = buildRoleMap("wiki");

/**
 * Get the role permissions for a given action type.
 */
export function getPermissions(action: ActionType, wikiDir: string = "wiki"): RolePermissions {
  if (wikiDir === "wiki") return DEFAULT_ROLE_MAP[action];
  return buildRoleMap(wikiDir)[action];
}

/**
 * Check if a file path is allowed for a given action.
 */
export function isFileAllowed(action: ActionType, filePath: string, wikiDir: string = "wiki"): boolean {
  const perms = getPermissions(action, wikiDir);

  // Check cannotWrite first — always wins
  for (const forbidden of perms.cannotWrite) {
    if (filePath === forbidden || filePath.startsWith(forbidden)) {
      return false;
    }
  }

  // Check canWrite — at least one pattern must match
  for (const allowed of perms.canWrite) {
    if (filePath === allowed || filePath.startsWith(allowed)) {
      return true;
    }
  }

  return false;
}

/**
 * Check a list of changed files against the permissions for an action.
 * Returns the list of files that violate the permission boundary.
 */
export function checkPermissionViolations(
  action: ActionType,
  changedFiles: string[],
  wikiDir: string = "wiki"
): string[] {
  return changedFiles.filter((file) => !isFileAllowed(action, file, wikiDir));
}
