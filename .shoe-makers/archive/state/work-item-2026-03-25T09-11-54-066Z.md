# Work Item: Complete permissions.test.ts coverage for all ActionTypes

skill-type: test

## What to build

The `allActions` array in `src/__tests__/permissions.test.ts` (line 9-18) is missing 5 action types that exist in the `ActionType` union (`src/types.ts:27-39`):

**Missing from `allActions`:**
- `continue-work`
- `dead-code`
- `innovate`
- `evaluate-insight`

Note: `continue-work` already has individual tests (lines 94-100) but is NOT in the `allActions` array used by the loop tests.

**Why this matters:** The `allActions` array is used in two critical loop tests:
1. Line 21-28: "returns permissions for every action type" — verifies every action has permissions defined
2. Line 78-82: "no action can write invariants.md" — verifies the ALWAYS_FORBIDDEN invariants protection
3. Line 179-182: "invariants.md is still forbidden with custom wikiDir" — same check with custom wiki

If a new action type is added without `invariants.md` in `cannotWrite`, these loops would NOT catch it because they only check 8 of 13 types.

## Relevant code

### Source: `src/verify/permissions.ts`
- `buildRoleMap` (line 27-91) defines permissions for ALL 13 action types
- `ALWAYS_FORBIDDEN` (line 19-21) includes `invariants.md`
- All actions correctly include `ALWAYS_FORBIDDEN` in their `cannotWrite` — but the test doesn't verify this for all of them

### Test: `src/__tests__/permissions.test.ts`
- `allActions` array (line 9-18): only 8 of 13 types listed
- Pattern to follow: the existing `continue-work` tests at lines 94-100 show the style for individual action tests

### Types: `src/types.ts`
- `ActionType` union (lines 27-39): the canonical list of all 13 action types

## Exact changes

1. **Update `allActions` in `src/__tests__/permissions.test.ts`** to include all 13 ActionType values:
   ```typescript
   const allActions: ActionType[] = [
     "fix-tests", "fix-critique", "critique", "continue-work",
     "review", "inbox", "execute-work-item", "dead-code",
     "prioritise", "innovate", "evaluate-insight", "explore",
   ];
   ```

2. **Add a drift-prevention test** that verifies `allActions` stays in sync with the `ActionType` union. Follow the pattern from `src/__tests__/action-classification.test.ts` or `src/__tests__/prompts.test.ts` which already have such drift tests.

3. **Add targeted permission tests for the missing action types**:
   - `dead-code` can write `src/`, cannot write wiki or invariants
   - `innovate` can write `.shoe-makers/insights/`, cannot write `src/` or wiki
   - `evaluate-insight` can write `.shoe-makers/insights/` and `.shoe-makers/state/`, cannot write `src/` or wiki

## What NOT to change

- Do not modify `src/verify/permissions.ts` — the permissions are correct, only the tests are incomplete
- Do not modify other test files
- Do not change any non-test source files

## Decision Rationale

Chose candidate #2 (permissions edge cases) over #1 (shift-log-parser) because:
- Permissions enforce the security boundary — invariants.md protection is the most critical guarantee in the system
- The gap is concrete and verifiable: 5 action types aren't checked by the `allActions` loop tests
- The shift-log-parser tests are already reasonably thorough (11 tests covering all functions)
- Permissions is a higher-impact, higher-severity gap even though both are test-coverage work
