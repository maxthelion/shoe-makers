# Review Uncommitted Work

There are uncommitted changes on the branch. Review them before committing.

Run `git diff` to see the changes. Check against these criteria:
1. Does the code correctly implement what was asked?
2. Are there tests for the changes, and do they verify actual behaviour?
3. Does the change match the wiki spec?

If the changes are good, commit them with a descriptive message. If not, fix the issues first.

**Off-limits — do NOT modify these files:**
- `.shoe-makers/invariants.md` — only humans maintain the spec claims
- `.shoe-makers/state/` — managed by the scheduler, not agents (except candidates.md and work-item.md which you write as part of the three-phase cycle)

## After completing

Run `bun run setup` again to get your next action.
