import type { WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { OFF_LIMITS, formatTopGaps, formatCodebaseSnapshot, formatSkillCatalog, determineTier, isInnovationTier } from "./helpers";

/**
 * Format process temperature guidance based on the shift's reactive ratio.
 * Returns an empty string if no process data is available or the ratio is moderate.
 */
function formatProcessTemperature(assessment: WorldState["blackboard"]["assessment"]): string {
  const patterns = assessment?.processPatterns;
  if (!patterns) return "";

  if (patterns.reactiveRatio > 0.6) {
    return `

## Process signal: high reactive ratio (${Math.round(patterns.reactiveRatio * 100)}%)

This shift has been mostly reactive — fixes, reviews, and critiques dominating over proactive work. Look for **root causes** of churn rather than more surface-level fixes. What architectural issues, missing infrastructure, or quality gaps are causing repeated reactive cycles?`;
  }

  if (patterns.reactiveRatio < 0.3) {
    return `

## Process signal: stable shift (${Math.round(patterns.reactiveRatio * 100)}% reactive)

This shift has been running smoothly with mostly proactive work. Candidates can be more ambitious — new features, creative improvements, or spec extensions. The system is stable enough to take risks.`;
  }

  return "";
}

/**
 * Build the explore prompt with tier-specific guidance.
 */
export function buildExplorePrompt(
  state: WorldState,
  skills?: Map<string, SkillDefinition>,
  article?: { title: string; summary: string },
): string {
  const tier = determineTier(state.blackboard.assessment);

  const lensSection = article ? `

## Creative Lens

A random concept for analogical thinking:

**${article.title}**

${article.summary}

Read the codebase through this lens. If anything about this concept suggests a better pattern, structure, or approach for the shoe-makers system, write it up as a candidate. Creative connections are valuable — they're how the system improves beyond its spec.` : "";

  const gapDetails = formatTopGaps(state.blackboard.assessment);

  const tierSection = tier.hasGaps ? `
## Current tier: Hygiene / Implementation

The codebase has ${tier.specOnlyCount} unimplemented spec claim(s) and ${tier.untestedCount} untested claim(s). Focus on:
- Spec-code inconsistencies and broken invariants
- Spec claims that aren't implemented yet
- Code smells, stale documentation, missing tests for critical paths${gapDetails}` : `
## Current tier: No major gaps detected

Survey the codebase for issues that the invariants may not cover: code smells, stale documentation, missing tests, spec-code inconsistencies.`;

  const processSection = formatProcessTemperature(state.blackboard.assessment);

  return `# Explore — Survey and Write Candidates

Nothing is queued for work. Your job is to survey the codebase and produce a ranked candidate list.
${tierSection}${processSection}

## Steps

1. Read wiki pages in \`wiki/pages/\` — what does the spec say should exist?
2. Read \`.shoe-makers/invariants.md\` — are there gaps?
3. Read the code in \`src/\` — what's built, what's missing?
4. Read findings in \`.shoe-makers/findings/\` — any open issues?
5. Check test coverage — untested paths?
6. Check code quality — files too complex or duplicated?
7. Check whether \`README.md\` accurately describes current capabilities
${lensSection}${formatSkillCatalog(skills)}

## Output

Write \`.shoe-makers/state/candidates.md\` with a ranked list of 3-5 work items:

\`\`\`markdown
# Candidates

## 1. [Title]
**Type**: implement | test | fix | health | doc-sync | improve
**Impact**: high | medium | low
**Reasoning**: Why this matters, what wiki page specifies it, what code is affected.

## 2. [Title]
...
\`\`\`

Be specific — reference file paths, wiki pages, and invariant IDs. You MUST produce at least 3 candidates. Commit \`candidates.md\` when done.

If you discover a creative insight — a non-obvious connection or a fundamentally better approach — write it to \`.shoe-makers/insights/YYYY-MM-DD-NNN.md\`. Insights are different from findings: they're proposals, not problems.

If you find code that works but has no matching invariant in \`.shoe-makers/invariants.md\`, write a finding suggesting a new invariant for the human to review.${OFF_LIMITS}`;
}

/**
 * Build the prioritise prompt with tier-specific guidance.
 */
export function buildPrioritisePrompt(state: WorldState): string {
  const tier = determineTier(state.blackboard.assessment);

  const gapDetails = formatTopGaps(state.blackboard.assessment);
  const tierGuidance = tier.hasGaps
    ? `The codebase has ${tier.specOnlyCount} unimplemented spec claim(s) and ${tier.untestedCount} untested claim(s). Prefer candidates that close these gaps — implementation and test work are both valuable here.${gapDetails}`
    : `All invariants are met and test coverage is solid. **Prefer implementation, improvement, and creative work** over writing more tests or polishing what's already clean. Pick the candidate with the highest impact on the system's usefulness — to humans and to agents.`;

  return `# Prioritise — Pick a Work Item

A previous elf explored the codebase and wrote a candidate list in \`.shoe-makers/state/candidates.md\`. Your job is to pick the most impactful candidate and write a detailed work item.

## Current state

${tierGuidance}

## Steps

1. Read \`.shoe-makers/state/candidates.md\`
2. For the top candidates, read the relevant wiki pages and source files to understand the context
3. Pick ONE candidate — the most impactful option
4. Write \`.shoe-makers/state/work-item.md\` with:
   - A clear title
   - If the work maps to a specific skill type (e.g. dead-code, implement, fix), add \`skill-type: <type>\` on a line by itself near the top
   - The relevant wiki text (quote it)
   - The relevant code (reference files and line numbers)
   - Exactly what to build or change
   - Which patterns to follow
   - What tests to write
   - What NOT to change
   - A brief "## Decision Rationale" explaining why this candidate was chosen over the others
5. Delete \`.shoe-makers/state/candidates.md\` (it's been consumed)
6. Commit both changes

Your job is to write a really good, specific prompt for the executor elf. Not "implement something from the wiki" but "the wiki says X, the code has Y, build Z in this file following this pattern."${OFF_LIMITS}`;
}

export function buildExecutePrompt(skillSection: string): string {
  return `# Execute Work Item

A previous elf wrote a detailed work item in \`.shoe-makers/state/work-item.md\`. Read it and do exactly what it says.

1. Read \`.shoe-makers/state/work-item.md\`
2. Do the work described — implement, test, or fix as instructed
3. Run \`bun test\` to confirm nothing is broken
4. Commit your work
5. Delete \`.shoe-makers/state/work-item.md\` (the work is done)
6. Optionally, write a new \`.shoe-makers/state/work-item.md\` as a follow-up for the next elf (e.g. "review what I just built" or "write tests for this feature")

The work-item contains specific, detailed instructions with full context. Follow them precisely.

When wiki and code diverge, check which changed more recently. If the wiki is newer, change code to match — never revert the wiki. The wiki is always the source of truth.${skillSection}${OFF_LIMITS}`;
}

export function buildDeadCodePrompt(skillSection: string): string {
  return `# Remove Dead Code

A work item in \`.shoe-makers/state/work-item.md\` describes dead code to remove. Read it and follow the instructions.

1. Read \`.shoe-makers/state/work-item.md\`
2. Verify each candidate is truly dead — grep for all references
3. Remove the dead code (source files AND their stale test files)
4. Run \`bun test\` to confirm nothing depended on the removed code
5. Commit your changes
6. Delete \`.shoe-makers/state/work-item.md\`

You ARE permitted to delete test files that test removed features.${skillSection}${OFF_LIMITS}`;
}

/**
 * Build the innovate prompt — deterministic creative brief with wiki summary + Wikipedia article.
 */
export function buildInnovatePrompt(
  wikiSummary: string,
  article: { title: string; summary: string },
): string {
  return `# Innovate — Creative Insight from Random Conceptual Collision

You are in **divergent/creative mode**. Your job is to make a connection between a random concept and the shoe-makers system. Most ideas will be bad — that's fine. Your job is to make the connection, not to judge it.

## The System

${wikiSummary}

## The Random Concept

**${article.title}**

${article.summary}

## Your Task

Read the shoe-makers codebase through the lens of this concept. Find a connection — however abstract — between the concept and something in the system. Then write a concrete proposal.

Your insight **MUST** use the Wikipedia article provided above as the lens. Do not use general knowledge — the whole point is forced serendipity from an outside concept. If you ignore the article and write about something unrelated, you have failed the task.

You **MUST** write an insight file to \`.shoe-makers/insights/YYYY-MM-DD-NNN.md\` (where NNN is a sequence number). "No connection found" is NOT acceptable output. Be creative. Be speculative. A bad idea is better than no idea.

The insight file must contain:

1. **Lens**: Start with the Wikipedia article title (e.g. "Lens: *Article Title* — ..."). This must reference the specific article above, not general knowledge
2. **Connection**: how it relates to the shoe-makers system
3. **Proposal**: a concrete change or improvement inspired by the connection
4. **Why**: why this would be better than the current approach

Commit the insight file when done.${OFF_LIMITS}`;
}

/**
 * Build the evaluate-insight prompt — generous evaluator that builds on ideas.
 */
export function buildEvaluateInsightPrompt(): string {
  return `# Evaluate Insight — Build on Creative Ideas

You are in **constructive/convergent mode**. Your job is NOT to filter ideas — it's to make them better. You have a **generous disposition**: look for the version of the idea that works.

## Steps

1. Read the insight file(s) in \`.shoe-makers/insights/\`
2. For each insight, engage constructively:
   - Could this actually work? What are the practical obstacles?
   - If the idea as stated wouldn't work, is there a **variant** that would?
   - "This wouldn't work because X, but Y would work" is the expected output shape
3. For each insight, decide:
   - **Promote**: the idea (or your improved version) is viable → write a \`.shoe-makers/state/work-item.md\` with specific implementation instructions, then delete the insight file
   - **Rework**: the core insight is interesting but needs development → rewrite the insight file with your improved version for a future elf to evaluate again
   - **Dismiss**: genuinely inapplicable (this should be the exception, not the default) → delete the insight file and note why in the shift log

You are NOT the prioritise elf. The prioritise elf is pragmatic and would kill most creative ideas. You are generous and constructive — your job is to find the version of each idea that works and develop it.

If you promote an insight to a work item, include:
- A clear title
- The original insight and your improved version
- Specific files to modify
- What tests to write
- What patterns to follow

Commit your changes when done.${OFF_LIMITS}`;
}
