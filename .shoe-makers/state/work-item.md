# Fix unspecified invariant for prompts/ directory

skill-type: octoclean-fix

## Context

After extracting `src/prompts.ts` into `src/prompts/`, the invariants checker reports 1 unspecified directory. This is because `EXCLUDED_TOP_LEVEL` in `src/verify/invariants.ts:108` lists `"prompts.ts"` (the old file) but not `"prompts"` (the new directory).

The `findUnspecifiedDirs` function splits source file paths by `/` and checks the first component. For `prompts/index.ts`, the first component is `"prompts"` — which isn't excluded or referenced in claim-evidence.

## What to change

In `src/verify/invariants.ts`, line 108, update `EXCLUDED_TOP_LEVEL`:
- Change `"prompts.ts"` to `"prompts"` in the Set

This is the minimal fix. The prompts module already has extensive claim-evidence coverage via `[generatePrompt]` references — the directory just needs to be in the exclusion list since it's a core module, not an independently-specifiable feature directory.

## Verification

- Run `bun test` — all tests pass
- Run `bun run setup` — invariants should show 0 unspecified

## What NOT to change

- Do NOT modify claim-evidence.yaml — the existing `[generatePrompt]` entries cover the prompts module
- Do NOT modify any prompt files
- Do NOT modify `.shoe-makers/invariants.md`
