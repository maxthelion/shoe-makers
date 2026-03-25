# Extract shared action classification constants

skill-type: health

## Problem

`src/log/shift-log-parser.ts` (lines 4-8) and `src/log/shift-summary.ts` (lines 53-57) define identical `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` sets:

```typescript
const REACTIVE_ACTIONS = new Set(["fix-tests", "fix-critique", "critique", "review", "inbox"]);
const PROACTIVE_ACTIONS = new Set(["explore", "prioritise", "execute-work-item", "dead-code", "innovate", "evaluate-insight"]);
```

If a new action type is added to the behaviour tree, both files must be updated independently.

## What to do

### 1. Create `src/log/action-classification.ts`

Create a new file with the shared constants:

```typescript
/** Actions considered reactive (urgent/corrective) */
export const REACTIVE_ACTIONS = new Set(["fix-tests", "fix-critique", "critique", "review", "inbox"]);

/** Actions considered proactive (planned/creative) */
export const PROACTIVE_ACTIONS = new Set(["explore", "prioritise", "execute-work-item", "dead-code", "innovate", "evaluate-insight"]);
```

### 2. Update `src/log/shift-log-parser.ts`

- Remove lines 4-8 (the local `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` definitions)
- Add import: `import { REACTIVE_ACTIONS, PROACTIVE_ACTIONS } from "./action-classification";`

### 3. Update `src/log/shift-summary.ts`

- Remove lines 53-57 (the local `REACTIVE_ACTIONS` and `PROACTIVE_ACTIONS` definitions)
- Add import: `import { REACTIVE_ACTIONS, PROACTIVE_ACTIONS } from "./action-classification";`

### 4. Run tests

Run `bun test` to confirm all 696+ tests still pass. The existing tests in `shift-log-parser.test.ts` and `shift-summary.test.ts` cover the classification logic and will verify the refactor is correct.

## What NOT to change

- Do not modify any test files
- Do not change the values in the sets
- Do not rename the constants
- Do not move `ACTION_TO_CATEGORY` or `TITLE_TO_ACTION` — those are module-specific

## Decision Rationale

Candidate #1 (shared action classification) was chosen over #2 (setup.ts refactor) because it's a smaller, safer refactor with clear test coverage. The setup.ts refactor is larger and riskier — it could break the setup flow if not done carefully. The DRY fix is a clean hygiene improvement that prevents future drift.
