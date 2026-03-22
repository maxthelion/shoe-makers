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
  | "review"
  | "inbox"
  | "implement-plan"
  | "implement-spec"
  | "write-tests"
  | "document"
  | "improve-health"
  | "explore";

/** @deprecated Use ActionType instead. Kept for backward compatibility. */
export type TickType = "assess" | "prioritise" | "work" | "verify";

/** The blackboard — shared state written as files on the branch */
export interface Blackboard {
  assessment: Assessment | null;
  priorities: PriorityList | null;
  currentTask: CurrentTask | null;
  verification: Verification | null;
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
  recentGitActivity: string[];
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

/** Output of the PRIORITISE tick */
export interface PriorityList {
  timestamp: string;
  /** Assessment timestamp this was derived from */
  assessedAt: string;
  items: PriorityItem[];
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

/** Output of the VERIFY tick */
export interface Verification {
  timestamp: string;
  taskDescription: string;
  testsPass: boolean;
  reviewPassed: boolean;
  issues: string[];
  action: "commit" | "revert";
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
  /** Frequency of creative lens in explore cycles (0-1, default 0.3) */
  insightFrequency: number;
}
