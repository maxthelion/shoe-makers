---
title: Skills
category: architecture
tags: [skills, tools, extensibility]
summary: The skill registry — self-contained units of work the behaviour tree can invoke.
last-modified-by: user
---

## What is a Skill?

A skill is a self-contained unit of work that the [[architecture|behaviour tree]] can invoke. Each skill:

- Declares what it can do and when it's applicable
- Takes a context (repo state, wiki, health scan) and produces a branch with changes
- Has its own verification criteria

Skills are defined as markdown files in `.shoe-makers/skills/` — they're prompts, not code.

## Planned Skills

### octoclean-fix
Improve code health scores. Uses [[existing-projects#octoclean|Octoclean]] to identify the worst files, then applies permitted actions: extract helpers, consolidate duplicates, update JSDoc, split large functions, rename symbols, remove dead exports.

### test-coverage
Add tests for uncovered code paths. Reads coverage reports to find gaps, writes tests that exercise the uncovered paths.

### doc-sync
Sync wiki pages with code changes. Reads recent git history, identifies pages that may be stale, updates them.

### bug-fix
Attempt fixes for open issues. Reads issue tracker, picks issues tagged as bugs, attempts a fix, runs tests.

### dependency-update
Update dependencies, run tests, check for breaking changes.

### dead-code
Remove unused exports, functions, and files. Conservative — only removes things with zero references.

## Skill Interface

Each skill markdown file should contain:

1. **Description** — what the skill does
2. **When to apply** — conditions under which the skill is relevant
3. **Instructions** — step-by-step prompt for the agent
4. **Verification criteria** — how to know the work is correct
5. **Risk level** — low/medium/high, affects whether auto-merge is allowed
6. **Permitted actions** — what the agent is allowed to change
7. **Off-limits** — what the agent must not touch
