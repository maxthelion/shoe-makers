# Add test coverage for 4 missing skill templates

## Context

`src/init-skill-templates.ts` exports 9 skill templates but `src/__tests__/init-templates.test.ts` only tests 5. The 4 untested templates are:

- `OCTOCLEAN_FIX_SKILL` (line 207)
- `BUG_FIX_SKILL` (line 251)
- `DEAD_CODE_SKILL` (line 292)
- `DEPENDENCY_UPDATE_SKILL` (line 333)

These are imported in `src/init.ts` (lines 14-17) and scaffolded to `.shoe-makers/skills/` during init. They work — they're just not tested.

This file has the lowest health score in the project (92/100). Adding test coverage should improve it.

## What to change

Edit `src/__tests__/init-templates.test.ts`:

1. Add the 4 missing imports on line 8-14:
```typescript
import {
  IMPLEMENT_SKILL,
  FIX_TESTS_SKILL,
  TEST_COVERAGE_SKILL,
  DOC_SYNC_SKILL,
  HEALTH_SKILL,
  OCTOCLEAN_FIX_SKILL,
  BUG_FIX_SKILL,
  DEAD_CODE_SKILL,
  DEPENDENCY_UPDATE_SKILL,
} from "../init-skill-templates";
```

2. Add the 4 missing entries to the `SKILL_TEMPLATES` array (line 16-22):
```typescript
const SKILL_TEMPLATES = [
  { name: "implement", template: IMPLEMENT_SKILL },
  { name: "fix-tests", template: FIX_TESTS_SKILL },
  { name: "test-coverage", template: TEST_COVERAGE_SKILL },
  { name: "doc-sync", template: DOC_SYNC_SKILL },
  { name: "health", template: HEALTH_SKILL },
  { name: "octoclean-fix", template: OCTOCLEAN_FIX_SKILL },
  { name: "bug-fix", template: BUG_FIX_SKILL },
  { name: "dead-code", template: DEAD_CODE_SKILL },
  { name: "dependency-update", template: DEPENDENCY_UPDATE_SKILL },
];
```

## Pattern to follow

The existing test loop (lines 33-54) iterates over `SKILL_TEMPLATES` and checks:
- YAML frontmatter delimiters (`---`)
- Required frontmatter fields: `name:`, `description:`, `maps-to:`, `risk:`
- Required sections: `## When to apply`, `## Instructions`, `## Verification criteria`, `## Permitted actions`, `## Off-limits`

The new templates will automatically be tested by this loop. No new test logic needed.

## Tests to verify

Run `bun test` — the test count should increase by 28 (4 templates × 7 assertions each: 1 frontmatter delimiter + 4 frontmatter fields + 0 wait, it's 1 delimiter check + 4 frontmatter + 5 sections = 10 per template, minus the existing... actually each template generates: 1 "has YAML frontmatter delimiters" + 4 "has required frontmatter field" + 5 "has required section" = 10 tests × 4 new templates = 40 new tests).

## What NOT to change

- Do NOT modify `src/init-skill-templates.ts` — the templates are fine
- Do NOT modify any other test files
- Do NOT change the test structure or assertions — just expand the array
