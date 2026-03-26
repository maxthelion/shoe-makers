/**
 * Core types for the shoe-makers behaviour tree system.
 */

/** Status returned by a condition node in the behaviour tree */
export type NodeStatus = "success" | "failure" | "running";

/** A condition check against the current world state */
export interface Condition {
  name: string;
  check: (state: WorldState) => boolean;
}

/** A behaviour tree node */
export interface TreeNode {
  type: "selector" | "sequence" | "condition" | "action";
  name: string;
  /** For selector/sequence: child nodes evaluated in order */
  children?: TreeNode[];
  /** For condition: the check function */
  condition?: Condition;
  /** For action: the skill to invoke */
  skill?: string;
}

/** Action type — what the tree decided the elf should do */
export type ActionType =
  | "fix-tests"
  | "fix-critique"
  | "critique"
  | "continue-work"
  | "review"
  | "inbox"
  | "execute-work-item"
  | "dead-code"
  | "prioritise"
  | "innovate"
  | "evaluate-insight"
  | "explore";


/** The blackboard — shared state written as files on the branch */
export interface Blackboard {
  assessment: Assessment | null;
  currentTask: CurrentTask | null;
  priorities: PriorityItem[] | null;
  verification: VerificationResult | null;
}

/** Result of a verification pass */
export interface VerificationResult {
  timestamp: string;
  passed: boolean;
  details: string;
}

/** Output of the ASSESS tick */
export interface Assessment {
  timestamp: string;
  invariants: {
    specifiedOnly: number;
    implementedUntested: number;
    implementedTested: number;
    unspecified: number;
    /** Top specified-only items by estimated impact */
    topSpecGaps: InvariantSummary[];
    /** Top untested items */
    topUntested: InvariantSummary[];
    /** Top unspecified items */
    topUnspecified: InvariantSummary[];
  } | null;
  healthScore: number | null;
  /** Worst files by health score (from octoclean) */
  worstFiles: { path: string; score: number }[];
  openPlans: string[];
  /** Findings from .shoe-makers/findings/ — persistent observations from previous elves */
  findings: Finding[];
  testsPass: boolean | null;
  /** Whether TypeScript compilation passes (npx tsc --noEmit). Optional for backward compatibility. */
  typecheckPass?: boolean | null;
  recentGitActivity: string[];
  /** Process patterns from current shift (reactive ratio, review loops) */
  processPatterns?: { reactiveRatio: number; reviewLoopCount?: number; reviewLoopDetected?: boolean; innovationCycleCount: number };
  /** Fields that couldn't be checked and why (e.g. missing tool, network error) */
  uncertainties?: { field: string; reason: string }[];
}

/** A finding from .shoe-makers/findings/ */
export interface Finding {
  /** Filename (without extension) */
  id: string;
  /** Raw markdown content */
  content: string;
}

export interface InvariantSummary {
  id: string;
  description: string;
  group: string;
}

export interface PriorityItem {
  rank: number;
  type: "implement" | "test" | "doc-sync" | "plan" | "fix" | "health";
  description: string;
  /** What to pass to the agent */
  taskPrompt: string;
  /** Why this was ranked here */
  reasoning: string;
  /** Estimated impact: low/medium/high */
  impact: "low" | "medium" | "high";
  /** Confidence the agent can do this well */
  confidence: "low" | "medium" | "high";
  /** What breaks if the agent gets it wrong */
  risk: "low" | "medium" | "high";
}

/** State of the current work tick */
export interface CurrentTask {
  startedAt: string;
  priority: PriorityItem;
  status: "in-progress" | "done" | "failed";
}

/** The world state read at the start of each tick */
export interface WorldState {
  /** Current branch name */
  branch: string;
  /** Whether there are uncommitted changes on the branch */
  hasUncommittedChanges: boolean;
  /** The blackboard state */
  blackboard: Blackboard;
  /** Number of unread inbox messages */
  inboxCount: number;
  /** Whether there are commits since last-reviewed-commit that need adversarial review */
  hasUnreviewedCommits: boolean;
  /** Number of unresolved critique findings */
  unresolvedCritiqueCount: number;
  /** Whether .shoe-makers/state/work-item.md exists */
  hasWorkItem: boolean;
  /** Whether .shoe-makers/state/candidates.md exists */
  hasCandidates: boolean;
  /** The skill type of the current work item, or null if no work item or unknown type */
  workItemSkillType: string | null;
  /** Whether .shoe-makers/state/partial-work.md exists (agent exited with partial status) */
  hasPartialWork: boolean;
  /** Number of insight files in .shoe-makers/insights/ */
  insightCount: number;
  /** Configuration (optional — defaults used if absent) */
  config?: Config;
}

/** Result of a pure-function agent execution */
export interface AgentResult {
  status: "done" | "partial" | "failed";
  /** Files changed (paths relative to repo root) */
  filesChanged: string[];
  /** Human-readable log of what the agent did */
  log: string;
}

/** Skill definition — what an agent can do */
export interface Skill {
  name: string;
  description: string;
  /** The prompt/instructions for the agent */
  prompt: string;
  /** Risk level affects whether results auto-merge */
  risk: "low" | "medium" | "high";
}

/** Configuration for a shoe-makers installation */
export interface Config {
  /** Branch prefix for nightly work */
  branchPrefix: string;
  /** How often the tick runs (in minutes) */
  tickInterval: number;
  /** Path to the wiki directory */
  wikiDir: string;
  /** Staleness threshold for assessment (in minutes) */
  assessmentStaleAfter: number;
  /** Maximum ticks per shift (safety limit) */
  maxTicksPerShift: number;
  /** Which skills are enabled (null = all enabled) */
  enabledSkills: string[] | null;
  /** Fraction of explore cycles that include a Wikipedia creative lens (0.0–1.0) */
  insightFrequency: number;
  /** Maximum innovation cycles per shift before routing to explore (default: 3) */
  maxInnovationCycles: number;
  /** Health regression tolerance in points (default: 2) */
  healthRegressionThreshold: number;
  /** Review loop breaker threshold — consecutive review actions before breaking out (default: 3) */
  reviewLoopThreshold: number;
  /** Timeout for Wikipedia API fetch in milliseconds (default: 10000) */
  wikipediaTimeout: number;
  /** Timeout for octoclean health scan in milliseconds (default: 120000) */
  octocleanTimeout: number;
}
