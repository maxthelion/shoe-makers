import { execSync } from "child_process";
import { getShiftDate } from "../schedule";

export function ensureBranch(repoRoot: string): string {
  const shiftDate = getShiftDate(repoRoot); // uses shared schedule module
  const branchName = `shoemakers/${shiftDate}`;

  try {
    execSync("git fetch origin", { cwd: repoRoot, stdio: "pipe" });
  } catch {}

  const currentBranch = execSync("git branch --show-current", {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();

  if (currentBranch !== branchName) {
    checkoutOrCreateBranch(repoRoot, branchName);
  }

  return branchName;
}

export function checkoutOrCreateBranch(repoRoot: string, branchName: string): void {
  try {
    execSync(`git rev-parse --verify origin/${branchName}`, { cwd: repoRoot, stdio: "pipe" });
    try {
      execSync(`git checkout ${branchName}`, { cwd: repoRoot, stdio: "pipe" });
      execSync(`git pull`, { cwd: repoRoot, stdio: "pipe" });
    } catch {
      execSync(`git checkout -b ${branchName} origin/${branchName}`, { cwd: repoRoot, stdio: "pipe" });
    }
  } catch {
    execSync(`git checkout -b ${branchName}`, { cwd: repoRoot, stdio: "pipe" });
  }
}
