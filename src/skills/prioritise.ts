import type { Assessment, PriorityList, PriorityItem } from "../types";
import { readBlackboard, writePriorities } from "../state/blackboard";

/**
 * Generate candidate work items from the assessment.
 *
 * Bootstrap version: deterministic heuristics, no LLM.
 * The spec says PRIORITISE should use LLM judgment for weighing
 * impact/confidence/risk/balance — that comes later.
 */
function generateCandidates(assessment: Assessment): PriorityItem[] {
  const candidates: PriorityItem[] = [];

  // Failing tests are always top priority
  if (assessment.testsPass === false) {
    candidates.push({
      rank: 0,
      type: "fix",
      description: "Fix failing tests",
      taskPrompt:
        "Run `bun test` to identify failing tests. Read the test files and source code to understand the failures. Fix the root cause — do not skip or delete tests.",
      reasoning: "Tests must pass before any other work can proceed.",
      impact: "high",
      confidence: "high",
      risk: "low",
    });
  }

  // Open plans suggest work to implement
  for (const plan of assessment.openPlans) {
    candidates.push({
      rank: 0,
      type: "implement",
      description: `Implement plan: ${plan}`,
      taskPrompt: `Read wiki/pages/${plan}.md to understand the plan. Implement the most foundational unbuilt piece. Write tests. Update the wiki spec if the design changes.`,
      reasoning: `Open plan "${plan}" describes work that hasn't been done yet.`,
      impact: "medium",
      confidence: "medium",
      risk: "medium",
    });
  }

  // Untested implementations need tests
  if (assessment.invariants?.implementedUntested && assessment.invariants.implementedUntested > 0) {
    const topUntested = assessment.invariants.topUntested[0];
    candidates.push({
      rank: 0,
      type: "test",
      description: topUntested
        ? `Add tests for: ${topUntested.description}`
        : "Add tests for untested implementations",
      taskPrompt: topUntested
        ? `The invariant "${topUntested.id}" is implemented but has no tests. Write tests that verify the behaviour described in the wiki spec.`
        : "Find implemented features without test coverage and add tests.",
      reasoning: `${assessment.invariants.implementedUntested} invariants are implemented but untested.`,
      impact: "medium",
      confidence: "high",
      risk: "low",
    });
  }

  // Spec gaps — things specified but not built
  if (assessment.invariants?.specifiedOnly && assessment.invariants.specifiedOnly > 0) {
    const topGap = assessment.invariants.topSpecGaps[0];
    candidates.push({
      rank: 0,
      type: "implement",
      description: topGap
        ? `Implement: ${topGap.description}`
        : "Implement specified-but-unbuilt features",
      taskPrompt: topGap
        ? `The invariant "${topGap.id}" is specified in the wiki but not implemented. Build it according to the spec. Write tests.`
        : "Find features specified in the wiki that aren't implemented yet and build the most foundational one.",
      reasoning: `${assessment.invariants.specifiedOnly} spec items have no implementation.`,
      impact: "high",
      confidence: "medium",
      risk: "medium",
    });
  }

  // Findings from previous elves — each finding is a potential work item
  if (assessment.findings && assessment.findings.length > 0) {
    for (const finding of assessment.findings) {
      candidates.push({
        rank: 0,
        type: "implement",
        description: `Address finding: ${finding.id}`,
        taskPrompt: `A previous elf left a finding in .shoe-makers/findings/${finding.id}.md. Read it and address the issue described. If the finding is a blocker, fix the blocker. If it's a question, investigate and either resolve it or document the answer. Delete or archive the finding once resolved.\n\nFinding content:\n${finding.content}`,
        reasoning: `Finding "${finding.id}" was left by a previous elf and needs attention.`,
        impact: "medium",
        confidence: "medium",
        risk: "low",
      });
    }
  }

  // Health improvements if score is low
  if (assessment.healthScore !== null && assessment.healthScore < 70) {
    candidates.push({
      rank: 0,
      type: "health",
      description: "Improve code health",
      taskPrompt:
        "Run the health score tool and address the lowest-scoring areas: reduce complexity, remove duplication, improve naming.",
      reasoning: `Health score is ${assessment.healthScore}/100 — below the 70 threshold.`,
      impact: "medium",
      confidence: "high",
      risk: "low",
    });
  }

  return candidates;
}

/**
 * Rank candidates using a simple heuristic score.
 *
 * Score = impact_weight + confidence_weight - risk_weight
 * where high=3, medium=2, low=1.
 *
 * In the future this should use LLM judgment for more nuanced weighing,
 * especially for balance and dependency analysis.
 */
function rankCandidates(candidates: PriorityItem[]): PriorityItem[] {
  const weight = { high: 3, medium: 2, low: 1 };

  const scored = candidates.map((c) => ({
    item: c,
    score: weight[c.impact] + weight[c.confidence] - weight[c.risk],
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s, i) => ({
    ...s.item,
    rank: i + 1,
  }));
}

/**
 * The prioritise skill: read assessment, generate and rank work items.
 *
 * Bootstrap version uses deterministic heuristics.
 * The wiki spec says this should eventually use LLM judgment.
 */
export async function prioritise(repoRoot: string): Promise<PriorityList> {
  const blackboard = await readBlackboard(repoRoot);

  if (!blackboard.assessment) {
    throw new Error("Cannot prioritise without an assessment. Run assess first.");
  }

  const candidates = generateCandidates(blackboard.assessment);
  const ranked = rankCandidates(candidates);

  const priorities: PriorityList = {
    timestamp: new Date().toISOString(),
    assessedAt: blackboard.assessment.timestamp,
    items: ranked,
  };

  await writePriorities(repoRoot, priorities);
  return priorities;
}
