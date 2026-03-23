import type { WorldState } from "../types";
import type { SkillDefinition } from "../skills/registry";
import { OFF_LIMITS, formatTopGaps, formatCodebaseSnapshot, formatSkillCatalog, determineTier } from "./helpers";

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
  const snapshot = formatCodebaseSnapshot(state.blackboard.assessment);

  const tierSection = tier.hasGaps ? `
## Current tier: Hygiene / Implementation

The codebase has ${tier.specOnlyCount} unimplemented spec claim(s) and ${tier.untestedCount} untested claim(s). Focus on:
- Spec-code inconsistencies and broken invariants
- Spec claims that aren't implemented yet
- Code smells, stale documentation, missing tests for critical paths${gapDetails}` : `
## Current tier: Innovation

All invariants are met. Tests pass. Health is good. Your job shifts from **gap-finding to improvement-finding**.

"No impactful work remaining" is NOT an acceptable output. There is always work to do. At this tier, ask:
- Could this system be easier to use for its human users?
- Could it be easier to use by agents?
- Is there a fundamentally better way to structure any part of this?
- What would make the morning review delightful instead of just informative?
- Are there features the wiki doesn't mention yet that would genuinely help?
- Could the explore/prioritise/execute cycle itself be improved?

Think like a product owner, not a linter. The codebase being "clean" is not the goal — the goal is a system that produces genuinely useful overnight improvements for the projects it's installed in.${snapshot}`;

  return `# Explore — Survey and Write Candidates

Nothing is queued for work. Your job is to survey the codebase and produce a ranked candidate list.
${tierSection}

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
3. Read \`.shoe-makers/insights/\` — for each insight, engage with the idea critically:
   - Could this actually work? What are the practical obstacles?
   - If the idea as stated wouldn't work, is there a **variant** that would? Write the improved version.
   - If the core insight is sound but the proposal is wrong, say "this wouldn't work because X, but Y would work" and rewrite as a viable candidate.
   - Then decide: **Promote** (viable → include as a candidate), **Rework** (rewrite the insight file with your improved version for a future elf), or **Dismiss** (not applicable → delete with a note in the shift log).
   - Your job is not just to judge — it's to build on the idea. The explore elf was in creative mode. You're in evaluative mode. Good evaluation improves ideas, not just filters them.
4. Pick ONE candidate — the most impactful option
5. Write \`.shoe-makers/state/work-item.md\` with:
   - A clear title
   - If the work maps to a specific skill type (e.g. dead-code, implement, fix), add \`skill-type: <type>\` on a line by itself near the top
   - The relevant wiki text (quote it)
   - The relevant code (reference files and line numbers)
   - Exactly what to build or change
   - Which patterns to follow
   - What tests to write
   - What NOT to change
6. Delete \`.shoe-makers/state/candidates.md\` (it's been consumed)
7. Commit both changes

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
