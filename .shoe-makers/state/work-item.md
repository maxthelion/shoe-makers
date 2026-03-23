# Doc-sync: document init-skill-template files and utils in wiki

skill-type: doc-sync

## Context

The invariants system reports 4 unspecified source entries:
- `code.init-skill-templates-docs.ts` — template strings for doc/test skills
- `code.init-skill-templates-quality.ts` — template strings for quality skills
- `code.init-skill-templates-work.ts` — template strings for work skills
- `code.utils` — shared utility functions (currently just `fileExists()`)

These exist in code but have no corresponding wiki spec claims. The wiki page `wiki/pages/integration.md` describes the init/scaffolding process and would be the natural place to document the template file structure. The `wiki/pages/architecture.md` page describes the overall system.

## What to do

1. Read `wiki/pages/integration.md` — find where it describes the init scaffolding
2. Add a brief section or note explaining that skill templates are organized into three files by category:
   - `init-skill-templates-work.ts` — medium-risk skills (implement, bug-fix, octoclean-fix, dependency-update)
   - `init-skill-templates-quality.ts` — low-risk quality skills (fix-tests, health, dead-code)
   - `init-skill-templates-docs.ts` — non-source skills (test-coverage, doc-sync)
3. Read `wiki/pages/architecture.md` — find where it could mention `src/utils/`
4. Add a brief mention of `src/utils/` as shared utility functions
5. Keep changes minimal and factual — describe what IS, not what should be

## What NOT to change

- Do not modify source code
- Do not modify `.shoe-makers/invariants.md`
- Do not modify test files
- Do not change page categories or tags
- Preserve existing frontmatter

## Verification

- Wiki pages accurately describe the current code structure
- Frontmatter is preserved
- No speculative content added
