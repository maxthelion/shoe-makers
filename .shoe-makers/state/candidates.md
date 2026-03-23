# Candidates

## 1. Improve health score of src/init-skill-templates.ts
**Type**: health
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Setup reports this file at health score 92 (worst in codebase). It's a large file of string constants for skill templates. Splitting into smaller focused modules or reducing duplication between templates would improve the health score. File: `src/init-skill-templates.ts`. The `wiki/pages/skills.md` spec defines 8+ skills; templates should stay aligned.

## 2. Parallelize sequential I/O in readWorldState
**Type**: health
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/state/world.ts:155-183` runs 6 awaited operations sequentially that could run in parallel via `Promise.all`, matching the pattern already used in `src/skills/assess.ts`. This would improve tick latency. Wiki page `architecture.md` emphasises that ticks should be fast.

## 3. Extract shared utility functions to reduce duplication
**Type**: health
**Impact**: medium
**Confidence**: medium
**Risk**: low
**Reasoning**: Shell git execution is duplicated across `src/skills/assess.ts:15`, `src/setup.ts:100`, `src/state/world.ts` (multiple sites). `fileExists()` is duplicated in `world.ts:114` and `init.ts:76`. Extracting `git-utils.ts` and `fs-utils.ts` would reduce duplication and improve health scores across multiple files.

## 4. Add missing test coverage for prompts.ts branches
**Type**: test
**Impact**: medium
**Confidence**: medium
**Risk**: low
**Reasoning**: `src/prompts.ts` (232 lines) generates action-specific prompts for 9 action types but not all branches are equally tested in `src/__tests__/prompts.test.ts`. The `explore` path with Wikipedia article injection and off-limits notice variations lack assertions. Wiki page `verification.md` emphasises that all code paths should have test evidence.

## 5. Create default .shoe-makers/config.yaml
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: README references config.yaml but the file doesn't exist — code falls back to defaults silently. Creating a default config.yaml with documented values would improve developer experience and eliminate README drift. See `src/config/load-config.ts` for the default values that should be documented.
