skill-type: bug-fix

# Fix branchPrefix config having no effect on branch names

## Wiki Spec

From `wiki/pages/scheduled-tasks.md:55`:
> Creates or checks out a branch named `{branchPrefix}/{shift-date}` (e.g. `shoemakers/2026-03-22`)

From `wiki/pages/integration.md:91`:
> `branch-prefix` | `shoemakers` | Branch name prefix

The spec is clear: the branch prefix should come from config.

## Current Code

`src/setup/branch.ts:6` hardcodes the branch name:
```ts
const branchName = `shoemakers/${shiftDate}`;
```

Meanwhile, `src/config/load-config.ts:97` correctly parses the config value:
```ts
branchPrefix: raw["branch-prefix"] ?? DEFAULTS.branchPrefix,
```

But `ensureBranch()` at `src/setup.ts:57` is called with only `repoRoot` — it never receives the config. Config is loaded later at `src/setup.ts:83`.

## What to Build

1. Change `ensureBranch(repoRoot: string)` signature to `ensureBranch(repoRoot: string, branchPrefix?: string)` with default `"shoemakers"` for backward compatibility.
2. Use the parameter: `const branchName = \`${branchPrefix}/${shiftDate}\``
3. In `src/setup.ts`, either:
   - Move `loadConfig` before `ensureBranch` and pass `config.branchPrefix`, OR
   - Load just the branch prefix early (simpler: just call loadConfig earlier)
4. Write tests for the new parameter.

## Patterns to Follow

- `src/config/load-config.ts` — how config values flow from YAML to typed Config object
- `src/setup.ts` — how config is passed to other functions (e.g., `config.tickInterval` at line 85, `config.insightFrequency` used in prompt building)
- Existing branch test patterns: `src/__tests__/schedule.test.ts` uses temp directories with `git init`

## Tests to Write

1. Test that `ensureBranch` uses the provided `branchPrefix` parameter in the branch name
2. Test that `ensureBranch` defaults to `"shoemakers"` when no prefix is provided (backward compat)
3. Test that a custom `branch-prefix` in config.yaml flows through to the actual branch name

## What NOT to Change

- Do NOT change the default branch prefix value (`"shoemakers"`)
- Do NOT change the config file format or key names
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change `getShiftDate()` or the schedule module
- Do NOT modify the `checkoutOrCreateBranch` helper — it already takes a branch name string

## Decision Rationale

Chosen over candidate 2 (world.test.ts health split) because this is a real bug — a documented config option that silently does nothing. It's a spec-code inconsistency that could confuse users and operators. The health improvements are valid but lower priority since health is already at 99/100. The doc-sync candidates (3, 5) require human action on invariants.md which elves can't do.
