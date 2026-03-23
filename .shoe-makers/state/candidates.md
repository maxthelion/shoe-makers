# Candidates

## 1. Improve health score of src/init-skill-templates.ts
**Type**: health
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Health score 92 (worst in codebase, consistently flagged). Large file of string template constants. Could reduce line count by extracting shared template sections (e.g. common frontmatter patterns, shared "Off-limits" and "Verification criteria" text). File: `src/init-skill-templates.ts`.

## 2. Add dedicated test for inbox prompt with message count
**Type**: test
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The `inbox` prompt at `src/prompts.ts:116-119` dynamically interpolates `state.inboxCount` into the prompt text. No dedicated test verifies that the count is correctly interpolated. A test with `inboxCount: 5` should show "5 message(s)" in the output.

## 3. Extract duplicated fileExists utility
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `fileExists()` is defined identically in `src/state/world.ts:114` and `src/init.ts`. Extracting to a shared module would eliminate duplication.
