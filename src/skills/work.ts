import type { CurrentTask, PriorityItem } from "../types";
import { readBlackboard, writeCurrentTask } from "../state/blackboard";
import { loadSkills, findSkillForType, type SkillDefinition } from "./registry";

/** Result of the work skill — what the agent should do */
export interface WorkResult {
  task: CurrentTask;
  instructions: string;
  /** The skill definition used, if one matched the priority type */
  skill: SkillDefinition | null;
}

/**
 * The work skill: pick the top priority item and set up the task.
 *
 * This skill reads the priority list, selects the top item,
 * writes current-task.json, and returns instructions for the agent.
 *
 * In the bootstrap phase, the "agent" is the scheduled task itself —
 * it receives the instructions and acts on them. In the full system,
 * this would invoke a pure-function agent with the task prompt.
 */
export async function work(repoRoot: string): Promise<WorkResult> {
  const blackboard = await readBlackboard(repoRoot);

  if (!blackboard.priorities) {
    throw new Error("Cannot work without priorities. Run prioritise first.");
  }

  if (blackboard.priorities.items.length === 0) {
    throw new Error("No priority items to work on.");
  }

  // Don't start new work if a task is already in progress
  if (blackboard.currentTask?.status === "in-progress") {
    throw new Error(
      `Task already in progress: "${blackboard.currentTask.priority.description}". ` +
      "Complete or verify the current task before starting new work."
    );
  }

  const topItem = blackboard.priorities.items[0];

  // Look up the skill definition for this priority type
  const skills = await loadSkills(repoRoot);
  const skill = findSkillForType(skills, topItem.type) ?? null;

  const currentTask: CurrentTask = {
    startedAt: new Date().toISOString(),
    priority: topItem,
    status: "in-progress",
  };

  await writeCurrentTask(repoRoot, currentTask);

  return {
    task: currentTask,
    instructions: buildInstructions(topItem, skill),
    skill,
  };
}

/**
 * Build human-readable instructions from a priority item and optional skill definition.
 *
 * When a matching skill exists, its full prompt (instructions, verification criteria,
 * permitted actions, off-limits) is included. Otherwise, falls back to the generic
 * task prompt from the priority item.
 */
function buildInstructions(item: PriorityItem, skill: SkillDefinition | null): string {
  const lines = [
    `## Task: ${item.description}`,
    "",
    `**Type**: ${item.type}`,
    `**Impact**: ${item.impact} | **Confidence**: ${item.confidence} | **Risk**: ${item.risk}`,
  ];

  if (skill) {
    lines.push(
      "",
      `**Skill**: ${skill.name} (risk: ${skill.risk})`,
      "",
      "### Context",
      "",
      item.taskPrompt,
      "",
      skill.body,
    );
  } else {
    lines.push(
      "",
      "### Instructions",
      "",
      item.taskPrompt,
      "",
      "### Constraints",
      "",
      "- Write tests for any new code",
      "- Run `bun test` and ensure all tests pass",
      "- Do not modify files unrelated to this task",
      "- If the task is too large, do a partial implementation and exit with status: partial",
    );
  }

  return lines.join("\n");
}
