# Explore — Survey and Write Candidates

Nothing is queued for work. Your job is to survey the codebase and produce a ranked candidate list.

## Current tier: No major gaps detected

Survey the codebase for issues that the invariants may not cover: code smells, stale documentation, missing tests, spec-code inconsistencies.

## Process signal

- Review loops this shift: 3 (3+ consecutive critique/fix-critique sequences)
- Innovation cycles: 3

## Steps

1. Read wiki pages in `wiki/pages/` — what does the spec say should exist?
2. Read `.shoe-makers/invariants.md` — are there gaps?
3. Read the code in `src/` — what's built, what's missing?
4. Read findings in `.shoe-makers/findings/` — any open issues?
5. Check test coverage — untested paths?
6. Check code quality — files too complex or duplicated?
7. Check whether `README.md` accurately describes current capabilities


## Available skills

When writing candidates, reference which skill type applies:
- **implement** (implement): Implement a feature specified in the wiki but not yet built.
- **dead-code** (dead-code): Remove dead code — unused exports, unreachable branches, stale modules.
- **health** (health): Improve code health scores by reducing complexity and duplication.
- **doc-sync** (doc-sync): Sync wiki pages with code changes to keep spec accurate.
- **fix-tests** (fix): Fix failing tests to restore a green build.
- **test-coverage** (test): Add tests for implemented but untested code paths.
- **bug-fix** (bug-fix): Fix bugs found in findings, issues, or discovered during exploration.
- **octoclean-fix** (octoclean-fix): Fix code health issues identified by octoclean — reduce complexity, improve structure.
- **dependency-update** (dependency-update): Update outdated dependencies, run tests, check for breaking changes.

## Output

Write `.shoe-makers/state/candidates.md` with a ranked list of 3-5 work items:

```markdown
# Candidates

## 1. [Title]
**Type**: implement | test | fix | health | doc-sync | improve
**Impact**: high | medium | low
**Reasoning**: Why this matters, what wiki page specifies it, what code is affected.

## 2. [Title]
...
```

Be specific — reference file paths, wiki pages, and invariant IDs. You MUST produce at least 3 candidates. Commit `candidates.md` when done.

If you discover a creative insight — a non-obvious connection or a fundamentally better approach — write it to `.shoe-makers/insights/YYYY-MM-DD-NNN.md`. Insights are different from findings: they're proposals, not problems.

If you find code that works but has no matching invariant in `.shoe-makers/invariants.md`, write a finding suggesting a new invariant for the human to review.

**Off-limits — do NOT modify these files:**
- `.shoe-makers/invariants.md` — only humans maintain the spec claims
- `.shoe-makers/state/` — managed by the scheduler, not agents (except candidates.md and work-item.md which you write as part of the three-phase cycle)

## After exploring

Run `bun run setup` again to get your next action.
