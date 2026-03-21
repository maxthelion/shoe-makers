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

Skills are defined as markdown files in `.shoe-makers/skills/` — they're prompts, not code. The skill registry (`src/skills/registry.ts`) loads these files, parses their frontmatter, and makes them available to the work skill. Each skill's `maps-to` field links it to a [[tick-types|priority item type]], so when the work skill picks a task, it automatically includes the matching skill's full instructions.

## Implemented Skills

### fix-tests
Fix failing tests. Maps to priority type `fix`. Risk: low.

### implement
Implement a feature specified in the wiki but not yet built. Maps to priority type `implement`. Risk: medium.

### test-coverage
Add tests for implemented but untested code paths. Maps to priority type `test`. Risk: low.

### doc-sync
Sync wiki pages with code changes. Maps to priority type `doc-sync`. Risk: low.

### health
Improve code health scores by reducing complexity and duplication. Maps to priority type `health`. Risk: low.

## Planned Skills (not yet implemented)

### octoclean-fix
Improve code health scores using [[existing-projects#octoclean|Octoclean]] to identify the worst files. Would replace the generic `health` skill with Octoclean-specific guidance.

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
