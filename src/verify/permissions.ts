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
 * Permission definitions for each action type.
 */
const ROLE_MAP: Record<ActionType, RolePermissions> = {
  "fix-tests": {
    role: "test-fixer",
    canWrite: ["src/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "wiki/"],
  },
  "fix-critique": {
    role: "critique-fixer",
    canWrite: ["src/", ".shoe-makers/findings/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "wiki/"],
  },
  critique: {
    role: "reviewer",
    canWrite: [".shoe-makers/findings/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "src/", "wiki/"],
  },
  review: {
    role: "reviewer",
    canWrite: [".shoe-makers/findings/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "src/", "wiki/"],
  },
  inbox: {
    role: "inbox-handler",
    canWrite: ["src/", "wiki/", ".shoe-makers/"],
    cannotWrite: [...ALWAYS_FORBIDDEN],
  },
  "execute-work-item": {
    role: "executor",
    canWrite: ["src/", "wiki/", ".shoe-makers/state/", ".shoe-makers/claim-evidence.yaml", "CHANGELOG.md", "README.md"],
    cannotWrite: [...ALWAYS_FORBIDDEN],
  },
  "dead-code": {
    role: "dead-code-remover",
    canWrite: ["src/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "wiki/"],
  },
  prioritise: {
    role: "prioritiser",
    canWrite: [".shoe-makers/state/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "src/", "wiki/"],
  },
  innovate: {
    role: "innovator",
    canWrite: [".shoe-makers/insights/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "src/", "wiki/"],
  },
  "evaluate-insight": {
    role: "insight-evaluator",
    canWrite: [".shoe-makers/insights/", ".shoe-makers/state/", ".shoe-makers/log/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "src/", "wiki/"],
  },
  explore: {
    role: "explorer",
    canWrite: [".shoe-makers/state/", ".shoe-makers/findings/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "src/", "wiki/"],
  },
};

/**
 * Get the role permissions for a given action type.
 */
export function getPermissions(action: ActionType): RolePermissions {
  return ROLE_MAP[action];
}

/**
 * Check if a file path is allowed for a given action.
 */
export function isFileAllowed(action: ActionType, filePath: string): boolean {
  const perms = ROLE_MAP[action];

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
  changedFiles: string[]
): string[] {
  return changedFiles.filter((file) => !isFileAllowed(action, file));
}
