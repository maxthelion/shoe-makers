/**
 * Evidence rule for a claim.
 *
 * sourceEvidence: patterns to find in source code (non-comment lines).
 *   Each sub-array is a group of alternatives — any match in the group counts.
 *   ALL groups must have at least one match for the claim to be "implemented".
 *
 * testEvidence: same structure for test files.
 *   ALL groups must match for the claim to be "tested".
 *
 * Example: sourceEvidence: [["case \"selector\"", "node.type === \"selector\""], ["children"]]
 *   means: (case "selector" OR node.type === "selector") AND (children)
 */
export interface EvidenceRule {
  sourceEvidence: string[][];
  testEvidence: string[][];
}

/**
 * Granular claim-to-evidence mapping.
 *
 * Each claim ID is page.claim-slug. Evidence rules use AND-of-OR groups:
 * all groups must have at least one matching pattern.
 */
export const CLAIM_EVIDENCE: Record<string, EvidenceRule> = {
  // === behaviour-tree.md ===
  "behaviour-tree.tree-evaluator": {
    sourceEvidence: [["export function evaluate"]],
    testEvidence: [["evaluate("]],
  },
  "behaviour-tree.selector-tries-children": {
    sourceEvidence: [["\"selector\""], ["children"]],
    testEvidence: [["selector"]],
  },
  "behaviour-tree.sequence-runs-in-order": {
    sourceEvidence: [["\"sequence\""], ["children"]],
    testEvidence: [["sequence"]],
  },
  "behaviour-tree.re-evaluates-from-scratch": {
    sourceEvidence: [["evaluate(defaultTree", "evaluate(node"]],
    testEvidence: [["evaluate("]],
  },
  "behaviour-tree.tree-order-priority": {
    sourceEvidence: [["makeConditionAction"], ["defaultTree"]],
    testEvidence: [["priority"]],
  },
  "behaviour-tree.macro-micro-priority": {
    sourceEvidence: [["makeConditionAction"], ["generatePrompt", "implement-spec"]],
    testEvidence: [["priority", "implement-spec"]],
  },
  "behaviour-tree.elf-is-prioritiser": {
    sourceEvidence: [["generatePrompt"], ["Pick the most"]],
    testEvidence: [["implement-spec", "implement-plan"]],
  },
  "behaviour-tree.should-never-sleep": {
    sourceEvidence: [["alwaysTrue"], ["explore"]],
    testEvidence: [["returns explore when nothing else matches", "explore"]],
  },
  "behaviour-tree.blackboard-pattern": {
    sourceEvidence: [["readBlackboard"], ["writeAssessment"]],
    testEvidence: [["blackboard"]],
  },
  "behaviour-tree.game-style-selector": {
    sourceEvidence: [["makeConditionAction"], ["\"selector\""]],
    testEvidence: [["fix-tests"], ["explore"]],
  },

  // === architecture.md ===
  "architecture.tick-every-5-minutes": {
    sourceEvidence: [["tickInterval"]],
    testEvidence: [["tickInterval"]],
  },
  "architecture.tree-routes-to-actions": {
    sourceEvidence: [["ActionType"], ["evaluate("]],
    testEvidence: [["action"]],
  },
  "architecture.blackboard-state-files": {
    sourceEvidence: [["shoe-makers/state"], ["assessment.json"]],
    testEvidence: [["assessment.json"]],
  },
  "architecture.agents-pure-functions": {
    sourceEvidence: [["AgentResult"], ["filesChanged"]],
    testEvidence: [["AgentResult"], ["filesChanged"]],
  },
  "architecture.config-in-shoe-makers": {
    sourceEvidence: [["loadConfig"], ["config.yaml"]],
    testEvidence: [["loadConfig"]],
  },
  "architecture.branch-is-state": {
    sourceEvidence: [["getCurrentBranch"]],
    testEvidence: [["branch"]],
  },

  // === pure-function-agents.md ===
  "pure-function-agents.agent-interface": {
    sourceEvidence: [["AgentResult"]],
    testEvidence: [["AgentResult"]],
  },
  "pure-function-agents.scheduler-handles-side-effects": {
    sourceEvidence: [["runSkill"]],
    testEvidence: [["runSkill"]],
  },
  "pure-function-agents.scheduler-module": {
    sourceEvidence: [["scheduler/tick", "scheduler/shift"]],
    testEvidence: [["scheduler/tick", "shift"]],
  },
  "pure-function-agents.partial-work-status": {
    sourceEvidence: [["\"partial\""]],
    testEvidence: [["partial"]],
  },

  // === tick-types.md ===
  "tick-types.assess-writes-assessment": {
    sourceEvidence: [["writeAssessment"]],
    testEvidence: [["assessment"]],
  },
  "tick-types.explore-writes-assessment": {
    sourceEvidence: [["writeAssessment"], ["assess"]],
    testEvidence: [["assessment"]],
  },
  "tick-types.tree-conditions-drive-actions": {
    sourceEvidence: [["testsFailing"], ["hasSpecGaps"]],
    testEvidence: [["fix-tests"], ["implement-spec"]],
  },
  "tick-types.assess-gathers-invariants": {
    sourceEvidence: [["checkInvariants"]],
    testEvidence: [["invariants"]],
  },
  "tick-types.assess-gathers-test-results": {
    sourceEvidence: [["runTests", "testsPass"]],
    testEvidence: [["testsPass"]],
  },
  "tick-types.assess-gathers-git-activity": {
    sourceEvidence: [["getRecentGitActivity", "recentGitActivity"]],
    testEvidence: [["recentGitActivity", "gitActivity"]],
  },
  "tick-types.assess-gathers-plans": {
    sourceEvidence: [["findOpenPlans", "openPlans"]],
    testEvidence: [["openPlans", "plans"]],
  },

  // === invariants.md ===
  "invariants.four-statuses": {
    sourceEvidence: [["specifiedOnly"], ["implementedUntested"], ["implementedTested"]],
    testEvidence: [["specifiedOnly", "implementedTested"]],
  },
  "invariants.extract-falsifiable-claims": {
    sourceEvidence: [["export function extractClaims"]],
    testEvidence: [["extractClaims"]],
  },
  "invariants.claim-evidence-pipeline": {
    sourceEvidence: [["CLAIM_EVIDENCE"], ["checkEvidence"]],
    testEvidence: [["CLAIM_EVIDENCE", "checkEvidence"]],
  },
  "invariants.report-drives-behaviour-tree": {
    sourceEvidence: [["checkInvariants"], ["specifiedOnly"]],
    testEvidence: [["checkInvariants"]],
  },
  "invariants.granularity-per-claim": {
    sourceEvidence: [["export function extractClaims"], ["checkEvidence"]],
    testEvidence: [["extractClaims"]],
  },

  // === verification.md ===
  "verification.tests-must-pass": {
    sourceEvidence: [["testsPass"]],
    testEvidence: [["testsPass"]],
  },
  "verification.commit-or-revert": {
    sourceEvidence: [["\"commit\""], ["\"revert\""]],
    testEvidence: [["commit"], ["revert"]],
  },
  "verification.adversarial-review": {
    sourceEvidence: [["hasUnreviewedCommits"], ["critique"], ["last-reviewed-commit"]],
    testEvidence: [["critique"], ["unreviewed"]],
  },
  "verification.review-checks-diff": {
    sourceEvidence: [["Adversarial Review"], ["git diff"], ["critique"]],
    testEvidence: [["critique"]],
  },
  "verification.critiques-become-findings": {
    sourceEvidence: [["critique-"], ["findings"], ["fix-critique"]],
    testEvidence: [["critique"], ["fix-critique"]],
  },
  "verification.verify-module": {
    sourceEvidence: [["verify/invariants"]],
    testEvidence: [["verify/invariants", "checkInvariants"]],
  },
  "verification.role-based-permissions": {
    sourceEvidence: [["canWrite", "permittedFiles", "allowedPaths"], ["role"]],
    testEvidence: [["permission"], ["role"]],
  },
  "verification.tdd-enforcement": {
    sourceEvidence: [["TDD", "Write Tests First", "Write tests first"], ["test-writer"]],
    testEvidence: [["TDD", "test-first", "Write Tests First"], ["test-writer"]],
  },
  "verification.invariants-human-only": {
    sourceEvidence: [["invariants.md"], ["cannotWrite", "off-limits", "forbidden"]],
    testEvidence: [["invariants.md"], ["forbidden", "off-limits", "cannotWrite"]],
  },

  // === skills.md ===
  "skills.markdown-skill-files": {
    sourceEvidence: [["loadSkills"], ["parseSkillFile"]],
    testEvidence: [["loadSkills", "parseSkillFile"]],
  },
  "skills.registry-matches-types": {
    sourceEvidence: [["findSkillForType"]],
    testEvidence: [["findSkillForType"]],
  },
  "skills.frontmatter-interface": {
    sourceEvidence: [["maps-to", "mapsTo"]],
    testEvidence: [["maps-to", "mapsTo"]],
  },

  // === observability.md ===
  "observability.shift-log-per-day": {
    sourceEvidence: [["appendToShiftLog"]],
    testEvidence: [["appendToShiftLog", "shiftLog"]],
  },
  "observability.findings-directory": {
    sourceEvidence: [["readFindings(", "loadFindings(", "shoe-makers/findings"]],
    testEvidence: [["findings"]],
  },
  "observability.timestamped-entries": {
    sourceEvidence: [["timeStamp", "timestamp"]],
    testEvidence: [["timestamp"]],
  },

  // === wiki-as-spec.md ===
  "wiki-as-spec.four-statuses": {
    sourceEvidence: [["specifiedOnly"], ["implementedUntested"], ["implementedTested"], ["unspecified"]],
    testEvidence: [["specifiedOnly"]],
  },
  "wiki-as-spec.three-questions-drive-work": {
    sourceEvidence: [["specifiedOnly"], ["implementedUntested"]],
    testEvidence: [["specifiedOnly"]],
  },
  "wiki-as-spec.agents-route-by-status": {
    sourceEvidence: [["\"implement\""], ["\"test\""], ["\"doc-sync\""]],
    testEvidence: [["implement"]],
  },

  // === branching-strategy.md ===
  "branching-strategy.one-branch-per-shift": {
    sourceEvidence: [["branchPrefix"]],
    testEvidence: [["branch"]],
  },
  "branching-strategy.branch-is-state": {
    sourceEvidence: [["getCurrentBranch"], ["hasUncommittedChanges"]],
    testEvidence: [["branch"]],
  },

  // === functionality.md ===
  "functionality.inbox-reads-messages": {
    sourceEvidence: [["shoe-makers/inbox", ".shoe-makers/inbox"]],
    testEvidence: [["inbox"]],
  },
  "functionality.findings-persist-across-shifts": {
    sourceEvidence: [["readFindings(", "shoe-makers/findings"]],
    testEvidence: [["findings"]],
  },
  "functionality.shift-log-narrative": {
    sourceEvidence: [["appendToShiftLog"], ["formatTickLog"]],
    testEvidence: [["appendToShiftLog", "formatTickLog"]],
  },
  "functionality.config-yaml": {
    sourceEvidence: [["config.yaml"], ["tickInterval"], ["assessmentStaleAfter"], ["branchPrefix"]],
    testEvidence: [["config"]],
  },
  "functionality.plan-status-lifecycle": {
    sourceEvidence: [["findOpenPlans"], ["status:\\s*(blocked|done)", "status: blocked", "status: done"]],
    testEvidence: [["plan"]],
  },
  "functionality.skills-as-markdown": {
    sourceEvidence: [["loadSkills"], ["parseSkillFile"]],
    testEvidence: [["loadSkills", "parseSkillFile"]],
  },
  "functionality.multi-tick-shift": {
    sourceEvidence: [["export async function shift"]],
    testEvidence: [["shift("]],
  },
  "functionality.task-lifecycle-cli": {
    sourceEvidence: [["task:status", "\"status\""], ["task:done", "\"done\""], ["task:fail", "\"fail\""]],
    testEvidence: [["task"]],
  },

  // === plans-vs-spec.md ===
  "plans-vs-spec.plan-category-in-frontmatter": {
    sourceEvidence: [["findOpenPlans"], ["category"]],
    testEvidence: [["plan"]],
  },
  "plans-vs-spec.plans-feed-prioritiser": {
    sourceEvidence: [["openPlans"], ["Implement plan", "type: \"plan\""]],
    testEvidence: [["openPlans", "plan"]],
  },
};
