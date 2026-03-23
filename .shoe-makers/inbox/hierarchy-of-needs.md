# Hierarchy of needs — stop saying "nothing to do"

The explore and prioritise prompts have been rewritten with a three-tier hierarchy. Read them carefully — your behaviour should change based on which tier the system is in.

## The three tiers

1. **Hygiene**: spec-code inconsistencies, broken invariants, code smells, missing tests. Fix the mess before building new things.
2. **Implementation**: build things that are specified but not built. Wiki plans, unimplemented spec claims, features described but not coded.
3. **Innovation**: actively improve the system beyond its current spec. Make it easier for humans to use. Make it easier for agents to use. Use the Wikipedia creative lens to find non-obvious improvements. Think like a product owner.

## What changes

- The explore prompt now tells you which tier you're in based on invariant counts
- **"No impactful work remaining" is never acceptable.** If everything is green, you're at tier 3 — your job shifts from gap-finding to improvement-finding
- The prioritise prompt no longer says "lowest-risk" — impact is what matters
- There's a new candidate type: `improve` — for UX, ergonomics, and creative refactoring
- You MUST produce at least 3 candidates every explore cycle

## Questions to ask at tier 3

- Could this system be easier to use for its human users?
- Could it be easier to use by agents?
- Is there a fundamentally better way to structure any part of this?
- What would make the morning review delightful?
- Could the explore/prioritise/execute cycle itself be improved?
