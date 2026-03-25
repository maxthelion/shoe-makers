# Candidates

## 1. Split wikipedia.test.ts and world.test.ts for health improvement
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: The two remaining worst-scoring files are `src/__tests__/wikipedia.test.ts` (95) and `src/__tests__/world.test.ts` (95). Previous splits successfully removed files from the worst list. Continuing this pattern for the last two 95-score files would push the floor to 96+. However, returns are diminishing — the overall health score has remained at 99 through all splits.

## 2. Add error-path test coverage for creative/wikipedia.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/creative/wikipedia.ts` (205 lines) handles corpus loading, random article selection, and marking articles as used. Error paths include: empty corpus directory, malformed markdown files (missing frontmatter), all articles already used, filesystem errors during marking. These paths are exercised only by the happy-path tests in `wikipedia.test.ts`. Adding targeted error-path tests would catch regressions in the creative exploration feature specified in `wiki/pages/creative-exploration.md`.

## 3. Verify and document the init scaffolding against wiki spec
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `src/init.ts` (168 lines) scaffolds the `.shoe-makers/` directory structure when running `bun run init`. The wiki page `wiki/pages/bootstrapping.md` specifies what init should create. A doc-sync pass would verify that: (a) init creates all directories and files mentioned in the spec, (b) the default skill templates match the 9 skills listed in the wiki, (c) the README's "Getting Started" section accurately describes the init process. Any discrepancies should be fixed in code (if wiki is newer) or documented.
