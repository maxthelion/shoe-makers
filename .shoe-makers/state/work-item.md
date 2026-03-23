# Wire Up Permission Enforcement in the Adversarial Review Prompt

skill-type: implement

## Context

The wiki (`verification.md`, lines 64-65) specifies that the reviewer should check:
> "**Scope violation**: did the elf touch files outside its allowed list?"

The code infrastructure exists: `checkPermissionViolations()` in `src/verify/permissions.ts` takes an `ActionType` and a list of changed files, and returns any files that violate the role's permission boundary. It's well-tested in `src/__tests__/permissions.test.ts` and `src/__tests__/tdd-enforcement.test.ts`.

**Problem**: `checkPermissionViolations()` is never called outside of tests. The adversarial review prompt (generated in `src/prompts/`) doesn't include automated permission checking. The reviewer elf must manually inspect file paths — which is error-prone and inconsistent.

## What to build

Add automated permission violation detection to the critique/review action flow. When the setup script generates the adversarial review prompt, it should:

1. Read `last-action.md` to determine what action type the previous elf was given
2. Run `git diff --name-only <last-reviewed-commit>..HEAD` to get changed files
3. Call `checkPermissionViolations(actionType, changedFiles)` to find violations
4. Include the violations (if any) prominently in the review prompt — e.g., "WARNING: The following files were modified outside the elf's permitted scope: [list]"

## Where to implement

- **`src/setup.ts`** or **`src/prompts/`** — where the critique/review prompt is built. Read the existing prompt-building code to find the right insertion point.
- Import `checkPermissionViolations` from `src/verify/permissions.ts`
- Parse the action type from `last-action.md` content (you'll need to map the action title back to an `ActionType`)

## Patterns to follow

- The prompt builders in `src/prompts/` are pure functions that take data in and return strings out — no side effects
- The `ActionType` type in `src/types.ts` lists all valid action types
- `readWorldState()` in `src/state/world.ts` already reads git state — follow its patterns for git commands

## Tests to write

- Test that `checkPermissionViolations` correctly identifies violations for known action types (already exists — verify it's comprehensive)
- Test that the prompt builder includes violation warnings when violations are present
- Test that the prompt builder omits the warning when no violations exist

## What NOT to change

- Do NOT modify `src/verify/permissions.ts` — the permission logic is correct, it just needs to be called
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the permission definitions (ROLE_MAP) — only wire up the existing enforcement
- Do NOT block the review if violations are found — just surface them prominently in the prompt for the reviewer elf to act on
