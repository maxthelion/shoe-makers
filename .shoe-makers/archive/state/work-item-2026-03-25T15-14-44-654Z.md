# Improve health of prompts.test.ts

skill-type: health

## What to do

Reduce complexity and duplication in `src/__tests__/prompts.test.ts` (currently 87/100 health, worst file in codebase) by:

1. Remove trailing blank lines (lines 580-596 have 6 empty lines before the last describe block, plus trailing newlines)
2. Group the flat `promptCases` array by action type into nested `describe` blocks for better organization
3. Clean up duplicate test coverage — several tests in later `describe` blocks re-test things already covered by `promptCases` (e.g., creative lens tests at lines 231-249 duplicate tests at lines 454-468)

## Key constraint

Do NOT change test behavior — only reorganize structure. All 893 tests must still pass after changes. Run `bun test` to verify.

## Decision Rationale

Chose prompts.test.ts (87) over prompt-builders.test.ts (90) since it's the worst-scoring file and has the most room for improvement. Chose health over setup.ts extraction (91) since the delta is larger.
