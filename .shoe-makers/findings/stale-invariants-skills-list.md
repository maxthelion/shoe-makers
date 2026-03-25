# Stale sections in invariants.md

## Observation

Multiple sections of `.shoe-makers/invariants.md` are out of date:

### Section 3.2 — Skills list is stale
- **Listed as current**: fix-tests, implement, test-coverage, doc-sync, health
- **Listed as planned**: octoclean-fix, bug-fix, dependency-update, dead-code
- **Reality**: All 9 skills are now implemented in `.shoe-makers/skills/`. The "Planned" list should be merged into "Current" or removed.

### Section 2.2 — Missing reactive conditions
Lists 4 reactive conditions: tests failing, critiques, unreviewed commits, inbox messages.
The actual tree (`src/tree/default-tree.ts`) has 5 reactive conditions — **uncommitted changes** (review) is missing. The section also doesn't mention the **dead-code work-item** node that sits between inbox and the three-phase zone.

### Duplicate section numbering
- Section 1.6 appears twice: "TDD enforcement" and "Maintain a living spec"
- Section 3.4 appears twice: "Cross-elf gatekeeping" and "Observability"
One of each pair should be renumbered (e.g., 1.7 and 3.5).

## Why it matters

The invariants are the source of truth for spec claims. Stale invariants mislead explore/prioritise about what's built vs. what needs building. Missing reactive conditions in 2.2 means the invariants don't accurately describe the tree structure.

## Recommendation

Human should:
1. Update section 3.2 to list all 9 skills as current
2. Add `uncommitted changes → review` and `dead-code work-item → dead-code` to section 2.2
3. Renumber duplicate sections (1.6 → 1.7, 3.4 → 3.5)

## Status

Open — requires human action (elves cannot modify invariants.md).
