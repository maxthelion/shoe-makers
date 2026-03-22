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

### octoclean-fix
Improve code health scores using [[existing-projects#octoclean|Octoclean]] to identify the worst files. Maps to priority type `octoclean-fix`. Risk: medium.

### bug-fix
Attempt fixes for open issues. Reads issue tracker, picks issues tagged as bugs, attempts a fix, runs tests. Maps to priority type `bug-fix`. Risk: medium.

### dead-code
Remove unused exports, functions, and files. Conservative — only removes things with zero references. Maps to priority type `dead-code`. Risk: low.

## Planned Skills (not yet implemented)

### dependency-update
Update dependencies, run tests, check for breaking changes.

## Skill Interface

Each skill markdown file has YAML frontmatter (required fields: `name`, `description`, `maps-to`, `risk`) and a markdown body:

### Frontmatter (required)
- **name** — skill identifier (e.g. `implement`)
- **description** — what the skill does
- **maps-to** — links to a priority/action type (e.g. `implement`, `fix`, `health`, `test`, `doc-sync`). The registry uses this to match skills to tree actions.
- **risk** — low/medium/high, affects whether auto-merge is allowed

### Body sections
1. **When to apply** — conditions under which the skill is relevant
2. **Instructions** — step-by-step prompt for the agent
3. **Verification criteria** — how to know the work is correct
4. **Permitted actions** — what the agent is allowed to change
5. **Off-limits** — what the agent must not touch (parsed by the registry and enforced)
