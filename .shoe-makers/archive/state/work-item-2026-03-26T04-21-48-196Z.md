skill-type: dead-code

# Remove dead code: action-constants.ts (stale duplicate of action-classification.ts)

## Wiki Spec

From `wiki/pages/verification.md` (line 28): The dead-code-remover role can write `src/` but not invariants or wiki. Dead code removal should be conservative — only remove things with zero references in production code.

## Current Code

Two nearly identical files exist:

1. **`src/log/action-constants.ts`** (5 LOC) — DEAD CODE:
   - `REACTIVE_ACTIONS` = Set(["fix-tests", "fix-critique", "critique", "review", "inbox"])
   - `PROACTIVE_ACTIONS` = Set(["explore", "prioritise", "execute-work-item", "dead-code", "innovate", "evaluate-insight"])
   - **Missing `"continue-work"` in REACTIVE_ACTIONS** — this set is stale/incorrect
   - Only imported by `src/__tests__/action-constants.test.ts` (30 LOC)
   - **Zero production imports**

2. **`src/log/action-classification.ts`** (5 LOC) — ACTIVE CODE:
   - Same exports but correctly includes `"continue-work"` in REACTIVE_ACTIONS
   - Imported by `src/log/shift-summary.ts` (line 3) and `src/log/shift-log-parser.ts` (line 3)
   - Has its own test: `src/__tests__/action-classification.test.ts`

## What to Build

1. Delete `src/log/action-constants.ts`
2. Delete `src/__tests__/action-constants.test.ts`
3. Run `bun test` to confirm all tests still pass
4. Verify no other imports reference `action-constants` (already confirmed: zero production imports)

## Patterns to Follow

Follow the dead-code removal pattern: verify zero references with grep, delete the files, run tests.

## Tests to Write

No new tests needed. The correct file (`action-classification.ts`) already has its own comprehensive test file (`action-classification.test.ts`) that covers REACTIVE_ACTIONS, PROACTIVE_ACTIONS, disjointness, and drift prevention against the actual tree definitions.

## What NOT to Change

- Do NOT modify `src/log/action-classification.ts` — it's the correct, active version
- Do NOT modify `src/__tests__/action-classification.test.ts` — it's the correct test
- Do NOT modify `src/log/shift-summary.ts` or `src/log/shift-log-parser.ts`
- Do NOT touch `.shoe-makers/invariants.md`

## Decision Rationale

Candidate 1 chosen over candidates 2 and 3 because:
- **Concrete dead code**: The file is provably dead (zero production imports) and provably stale (missing `continue-work`)
- **Correctness improvement**: Removing stale code prevents confusion if someone accidentally imports the wrong file
- **Zero risk**: Deleting unused files with zero production references cannot break anything
- Candidates 2 and 3 (test isolation, fragile test) are health improvements that can follow in the next cycle
