import type { WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { OFF_LIMITS, formatTopGaps, formatSkillCatalog, determineTier } from "./helpers";

/**
 * Format process temperature guidance based on the shift's reactive ratio.
 * Returns an empty string if no process data is available or the ratio is moderate.
 */
export function formatProcessTemperature(assessment: WorldState["blackboard"]["assessment"]): string {
  const patterns = assessment?.processPatterns;
  if (!patterns) return "";

  const details: string[] = [];

  if (patterns.reviewLoopCount > 0) {
    details.push(`- Review loops this shift: ${patterns.reviewLoopCount} (3+ consecutive critique/fix-critique sequences)`);
  }
  if (patterns.innovationCycleCount > 0) {
    details.push(`- Innovation cycles: ${patterns.innovationCycleCount}`);
  }

  const detailBlock = details.length > 0 ? `\n\n${details.join("\n")}` : "";

  if (patterns.reactiveRatio > 0.6) {
    return `

## Process signal: high reactive ratio (${Math.round(patterns.reactiveRatio * 100)}%)

This shift has been mostly reactive — fixes, reviews, and critiques dominating over proactive work. Look for **root causes** of churn rather than more surface-level fixes. What architectural issues, missing infrastructure, or quality gaps are causing repeated reactive cycles?${detailBlock}`;
  }

  if (patterns.reactiveRatio < 0.3) {
    return `

## Process signal: stable shift (${Math.round(patterns.reactiveRatio * 100)}% reactive)

This shift has been running smoothly with mostly proactive work. Candidates can be more ambitious — new features, creative improvements, or spec extensions. The system is stable enough to take risks.${detailBlock}`;
  }

  if (details.length > 0) {
    return `

## Process signal

${details.join("\n")}`;
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
