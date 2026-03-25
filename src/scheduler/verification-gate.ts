import { execSync } from "child_process";
import type { ActionType } from "../types";
import { verify as commitOrRevert } from "../verify/commit-or-revert";
import { appendToShiftLog } from "../log/shift-log";

/** Actions that produce code changes and should be gated */
export const WORK_ACTIONS: ActionType[] = [
  "execute-work-item",
  "fix-tests",
  "fix-critique",
  "dead-code",
  "continue-work",
  "inbox",
];

/** Check whether an action type is a work action subject to verification gating */
export function isWorkAction(actionType: ActionType | null): boolean {
  return actionType !== null && WORK_ACTIONS.includes(actionType);
}

/**
 * Verification gate: revert the elf's last commit if tests fail or health regresses.
 * Only applies to work actions (not orchestration like explore/prioritise).
 */
export async function runVerificationGate(
  repoRoot: string,
  testsPass: boolean,
  previousActionType: ActionType | null,
  healthRegression: string | null,
): Promise<void> {
  if (!previousActionType || !WORK_ACTIONS.includes(previousActionType)) return;

  const gate = commitOrRevert(testsPass, healthRegression);
  if (gate.decision === "revert") {
    console.warn(`[setup] Verification gate: reverting last commit (${gate.reason})`);
    try {
      execSync("git revert --no-edit HEAD", { cwd: repoRoot, stdio: "pipe" });
      await appendToShiftLog(
        repoRoot,
        `## ${new Date().toISOString()} — Verification Gate\n\n- Reverted last commit: ${gate.reason}\n`,
      );
    } catch (e) {
      console.warn("[setup] Revert failed — manual intervention may be needed");
    }
  }
}
