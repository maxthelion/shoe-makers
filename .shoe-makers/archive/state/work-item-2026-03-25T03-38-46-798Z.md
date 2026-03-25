# Doc-sync: update wiki skills.md to reflect current architecture

skill-type: doc-sync

## Context

`wiki/pages/skills.md` line 17 references "the work skill" twice:

> "...makes them available to the work skill. Each skill's `maps-to` field links it to a priority item type, so when the work skill picks a task, it automatically includes the matching skill's full instructions."

The "work skill" was part of the old tick-type model. The current system uses three-phase orchestration: the `explore` action surveys the codebase, `prioritise` picks a candidate and writes a detailed work-item.md, and `execute-work-item` does the work. The prompt generation system (`src/prompts/`) builds focused prompts that include skill instructions.

## What to change

In `wiki/pages/skills.md`, replace line 17:

**From:**
```
Skills are defined as markdown files in `.shoe-makers/skills/` — they're prompts, not code. The skill registry (`src/skills/registry.ts`) loads these files, parses their frontmatter, and makes them available to the work skill. Each skill's `maps-to` field links it to a [[tick-types|priority item type]], so when the work skill picks a task, it automatically includes the matching skill's full instructions.
```

**To:**
```
Skills are defined as markdown files in `.shoe-makers/skills/` — they're prompts, not code. The skill registry (`src/skills/registry.ts`) loads these files, parses their frontmatter, and makes them available to the prompt generation system. Each skill's `maps-to` field links it to an action type, so when the [[behaviour-tree]] routes to execute-work-item, the prompt includes the matching skill's full instructions.
```

## What NOT to change

- Do not modify `.shoe-makers/invariants.md`
- Do not modify source code

## Decision Rationale

Candidate #1 chosen: the wiki is the source of truth and referencing a removed concept ("work skill") is confusing for future elves and humans. The other candidates (test consolidation, fileExists tests) are lower priority cosmetic improvements.
