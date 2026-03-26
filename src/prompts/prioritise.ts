import type { WorldState } from "../types";
import { OFF_LIMITS, formatTopGaps, determineTier } from "./helpers";

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
4. Write \`.shoe-makers/state/work-item.md\` using this exact format:

\`\`\`markdown
skill-type: [implement | test-coverage | fix | health | doc-sync | octoclean-fix | dead-code | bug-fix | dependency-update]

# [YOUR TITLE HERE]

## Wiki Spec

[YOUR CONTENT HERE — quote the relevant wiki text, cite the page and line numbers]

## Current Code

[YOUR CONTENT HERE — reference specific files and line numbers, describe what exists]

## What to Build

[YOUR CONTENT HERE — exactly what to build or change, step by step]

## Patterns to Follow

[YOUR CONTENT HERE — which existing patterns in the codebase to follow]

## Tests to Write

[YOUR CONTENT HERE — specific tests to write, what behaviour they verify]

## What NOT to Change

[YOUR CONTENT HERE — explicit boundaries]

## Decision Rationale

[YOUR CONTENT HERE — why this candidate was chosen over the others]
\`\`\`

5. Delete \`.shoe-makers/state/candidates.md\` (it's been consumed)
6. Commit both changes

Your job is to write a really good, specific prompt for the executor elf. Not "implement something from the wiki" but "the wiki says X, the code has Y, build Z in this file following this pattern."${OFF_LIMITS}`;
}
