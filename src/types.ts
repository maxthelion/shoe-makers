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

/** The world state read at the start of each tick */
export interface WorldState {
  /** Current branch name */
  branch: string;
  /** Whether there are uncommitted changes on the branch */
  hasUncommittedChanges: boolean;
  /** Whether the test suite is passing */
  testsPass: boolean | null;
  /** Invariant counts from the wiki spec comparison */
  invariants: {
    specifiedOnly: number;
    implementedUntested: number;
    implementedTested: number;
    unspecified: number;
  } | null;
  /** Code health score (0-100) from octoclean, if available */
  healthScore: number | null;
  /** Open plans in the wiki */
  openPlans: string[];
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
  /** When this skill is applicable */
  applicable: (state: WorldState) => boolean;
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
  /** Which skills are enabled */
  enabledSkills: string[];
  /** Path to the wiki directory */
  wikiDir: string;
}
