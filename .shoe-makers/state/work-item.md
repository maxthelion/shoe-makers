# Extract detectPermissionViolations from setup.ts

skill-type: octoclean-fix

## Context

`src/setup.ts` (health score 95) is the 3rd worst file. It handles too many concerns: branch management, assessment, tree evaluation, prompt generation, permission detection, and logging. The `detectPermissionViolations` function logically belongs with the permission code in `src/verify/`.

## What to do

1. Create `src/verify/detect-violations.ts` containing the `detectPermissionViolations` function
2. Move the function from `src/setup.ts` to the new file
3. Export it and import it in `src/setup.ts`
4. The function uses: `readLastAction` from `src/state/last-action`, `parseActionTypeFromPrompt` from `src/prompts/helpers`, `checkPermissionViolations` from `src/verify/permissions`, `readFile` from `fs/promises`, `execSync` from `child_process`, and `join` from `path`
5. Run `bun test` to verify nothing breaks
6. Run `npx tsc --noEmit` to verify types

## Patterns to follow

- Keep the function signature the same: `detectPermissionViolations(repoRoot: string): Promise<string[] | undefined>`
- Follow the existing module pattern in `src/verify/` (e.g., `permissions.ts`, `health-regression.ts`)
- Keep imports minimal — only import what's needed

## What NOT to change

- Do NOT modify the function's logic — only its location
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any test files — this is a pure refactor with no behaviour change
