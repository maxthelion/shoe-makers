# Explore — Survey and Write Candidates

Nothing is queued for work. Your job is to survey the codebase and produce a ranked candidate list.

## Current tier: No major gaps detected

Survey the codebase for issues that the invariants may not cover: code smells, stale documentation, missing tests, spec-code inconsistencies.

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

Write `.shoe-makers/state/candidates.md` using this exact format:

```markdown
# Candidates

## 1. [YOUR TITLE HERE]
**Type**: implement | dead-code | health | doc-sync | fix | test | bug-fix | octoclean-fix | dependency-update
**Impact**: high | medium | low
**Reasoning**: [YOUR REASONING HERE — reference specific file paths, wiki pages, and invariant gaps. Be specific.]

## 2. [YOUR TITLE HERE]
**Type**: [choose from types above]
**Impact**: high | medium | low
**Reasoning**: [YOUR REASONING HERE]

## 3. [YOUR TITLE HERE]
**Type**: [choose from types above]
**Impact**: high | medium | low
**Reasoning**: [YOUR REASONING HERE]
```

You may add candidates 4 and 5 if you find additional high-value items. You MUST produce at least 3 candidates. Commit `candidates.md` when done.

If you discover a creative insight — a non-obvious connection or a fundamentally better approach — write it to `.shoe-makers/insights/YYYY-MM-DD-NNN.md`. Insights are different from findings: they're proposals, not problems.

If you find code that works but has no matching invariant in `.shoe-makers/invariants.md`, write a finding suggesting a new invariant for the human to review.

**Off-limits — do NOT modify these files:**
- `.shoe-makers/invariants.md` — only humans maintain the spec claims
- `.shoe-makers/state/` — managed by the scheduler, not agents (except candidates.md and work-item.md which you write as part of the three-phase cycle)

## After exploring

Run `bun run setup` again to get your next action.
