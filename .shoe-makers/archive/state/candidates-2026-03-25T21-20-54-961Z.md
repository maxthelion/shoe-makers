# Candidates

## 1. Add error-path test coverage for creative/wikipedia.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/creative/wikipedia.ts` (205 lines) handles corpus loading, random article selection, and marking articles as used. While happy-path tests exist, error paths are underexercised: malformed markdown files (missing/invalid frontmatter), filesystem errors during `markArticleUsed`, and edge cases in `pickUnusedArticle` when corpus has only non-markdown files. Adding 5-8 targeted error-path tests would harden the creative exploration feature specified in `wiki/pages/creative-exploration.md`.

## 2. Add integration test for full tick lifecycle
**Type**: test
**Impact**: medium
**Reasoning**: Individual components (tree evaluation, state reading, prompt generation, verification gate) are well-tested in isolation, but there's no end-to-end test exercising a complete tick: read state -> evaluate tree -> generate prompt -> verify result. The `src/scheduler/tick.ts` (49 lines) is the natural test target. An integration test using temp directories and mock state would validate wiring between components and catch subtle integration issues. This aligns with `wiki/pages/behaviour-tree.md` spec on testability.

## 3. Verify init scaffolding matches wiki spec
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `src/init.ts` (168 lines) scaffolds the `.shoe-makers/` directory structure. The wiki page `wiki/pages/bootstrapping.md` specifies what init should create. A doc-sync pass would verify that: (a) init creates all directories and files the spec mentions, (b) the default skill templates match the 9 skills listed in the wiki, (c) any new features added since init was written are reflected in the scaffolding. This ensures new installations get a complete starting point.
