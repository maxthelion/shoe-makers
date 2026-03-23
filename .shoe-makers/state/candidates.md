# Candidates

## 1. Refactor init-skill-templates.ts to reduce file size
**Type**: health
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/init-skill-templates.ts` has the worst health score in the codebase (92/100). It's a 379-line monolithic file containing 9 skill template strings. Could be split into smaller logical groups (e.g. work templates, quality templates, maintenance templates) or loaded from separate template files. This is the single biggest drag on the health score. Wiki page `functionality.md` specifies that health improvements are a valid work category. Affects `src/init-skill-templates.ts` and `src/init.ts`.

## 2. Remove dead code: prioritise.ts and work.ts
**Type**: dead-code
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/skills/prioritise.ts` and `src/skills/work.ts` (plus their test files) are remnants of the old four-tick design. They have no production call sites — the system now uses the flat selector model where the setup script generates prompts directly. Multiple critiques have flagged these as dead code. Removing them and their tests would reduce codebase noise and improve maintainability. Wiki `behaviour-tree.md` now describes the flat selector model, confirming these are obsolete.

## 3. Add invariant for src/utils/ directory
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The setup assessment reports 1 unspecified directory: `src/utils/`. This directory was created recently to hold shared utilities (`fs.ts` with `fileExists()`). CLAUDE.md was updated to list it, but there's no wiki spec coverage. Adding a brief mention in `wiki/pages/architecture.md` under the project structure section would resolve the unspecified invariant and bring the count to 0 across all categories. Low impact but high confidence and trivially achievable.
