# Fix hardcoded "wiki/" in permissions.ts to use configurable wikiDir

skill-type: bug-fix

## Problem

`src/verify/permissions.ts` hardcodes `"wiki/"` in every role's `canWrite`/`cannotWrite` lists. The system supports a configurable `wiki-dir` via `.shoe-makers/config.yaml` (parsed in `src/config/load-config.ts:99` as `wikiDir`), and other modules (`assess.ts`, `extract-claims.ts`, `invariants.ts`) already pass the configured `wikiDir` through. But permissions checking ignores the config entirely.

**Impact**: If a user configures `wiki-dir: docs/wiki`:
- An executor writing to `docs/wiki/pages/foo.md` would NOT be allowed (no `canWrite` match for `"docs/wiki/"`)
- A reviewer writing to `docs/wiki/pages/foo.md` would NOT be blocked (no `cannotWrite` match for `"docs/wiki/"`)
- Permission violation detection would produce false positives/negatives

## What to change

### 1. Make `getPermissions` accept a `wikiDir` parameter (src/verify/permissions.ts)

Current code (line 26-82):
```typescript
const ROLE_MAP: Record<ActionType, RolePermissions> = {
  "fix-tests": {
    role: "test-fixer",
    canWrite: ["src/"],
    cannotWrite: [...ALWAYS_FORBIDDEN, "wiki/"],
  },
  // ... all roles hardcode "wiki/"
};

export function getPermissions(action: ActionType): RolePermissions {
  return ROLE_MAP[action];
}
```

Change to: Accept an optional `wikiDir` parameter (default `"wiki"`). Build the role map dynamically or replace `"wiki/"` references with the configured path. The simplest approach: keep `ROLE_MAP` as a function that takes `wikiDir` and returns the map, OR have `getPermissions` accept `wikiDir` and replace `"wiki/"` entries with `wikiDir + "/"`.

**Pattern to follow**: See how `findOpenPlans` in `src/skills/assess.ts:64` accepts `wikiDir` with a default of `"wiki"`.

### 2. Update callers to pass wikiDir

- `src/verify/detect-violations.ts:36` — `checkPermissionViolations` needs wikiDir. Load config in `detectPermissionViolations` or accept it as a parameter. Since `detectPermissionViolations` is called from `setup.ts:103` where `config` is already loaded, passing it through is cleanest.
- `src/__tests__/tdd-enforcement.test.ts` — check if it calls permissions functions and update if needed.

### 3. Update `isFileAllowed` and `checkPermissionViolations` signatures

These functions currently only take `action` and `filePath`/`changedFiles`. Add optional `wikiDir` parameter with default `"wiki"` to maintain backward compatibility.

### 4. Also fix `readWikiOverview` in setup.ts (line 389)

Change:
```typescript
const content = await readFile(join(repoRoot, "wiki", "pages", file), "utf-8");
```
To:
```typescript
const content = await readFile(join(repoRoot, config.wikiDir, "pages", file), "utf-8");
```

The `config` is already loaded at `setup.ts:75`. Pass `config.wikiDir` to `readWikiOverview`.

### 5. Update tests

In `src/__tests__/permissions.test.ts`:
- Existing tests should still pass (default `"wiki"` preserves behavior)
- Add tests for custom wikiDir:
  - `isFileAllowed("critique", "docs/wiki/pages/foo.md", "docs/wiki")` should return `false` (reviewer can't write wiki)
  - `isFileAllowed("execute-work-item", "docs/wiki/pages/foo.md", "docs/wiki")` should return `true` (executor can write wiki)
  - `isFileAllowed("critique", "wiki/pages/foo.md", "docs/wiki")` should return `true` (with custom wikiDir, old `wiki/` is not forbidden)

In `src/__tests__/detect-violations.test.ts` (if it exists, or add tests):
- Test that violations use the correct wikiDir from config

## What NOT to change

- Do not modify `src/types.ts` (ActionType is fine)
- Do not modify `.shoe-makers/invariants.md`
- Do not modify wiki pages
- Do not change the config schema or loading logic
- Keep backward compatibility: existing calls without `wikiDir` must work unchanged (use default `"wiki"`)

## Decision Rationale

Candidate #1 (permissions.ts wiki-dir bug) was chosen over candidates #2-3 (test coverage) because:
- It's a real bug that would break the system for anyone using a custom wiki directory
- The permissions system is a security boundary — incorrect enforcement undermines the entire role-based model
- It's a concrete, well-scoped fix with clear test criteria
- Candidates #2-3 are valuable but lower risk — the existing 109 integration tests provide coverage
- Candidate #4 requires human action (invariants.md is off-limits)
- Candidate #5 is folded into this work item as a related fix
