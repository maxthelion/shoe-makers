skill-type: implement

# Enhance shift summary with process pattern detection

## Context

From insight 2026-03-23-001: the system can improve code but can't improve how it improves code. The shift summary currently produces mechanical category counts. Enhancing it with process pattern detection would surface meta-improvement opportunities that the explore elf can act on.

## What to build

Enhance `src/log/shift-summary.ts` `summarizeShift()` to include:

1. **Tick distribution ratio**: count reactive ticks (fix-tests, fix-critique, critique, review, inbox) vs. proactive ticks (explore, prioritise, execute, innovate, evaluate-insight). High reactive ratio suggests quality issues.

2. **Review loop detection**: check if the same action type appears 3+ times in sequence (e.g., critique → fix-critique → critique → fix-critique). This indicates multi-round review loops.

3. Add these as new fields to the `ShiftSummary` type.

4. Update `buildSuggestions()` in `src/skills/assess.ts` to include process suggestions when these patterns are detected (e.g., "High reactive ratio this shift — consider whether work quality can be improved to reduce review cycles").

## What NOT to change

- Do not modify the behaviour tree
- Do not add new tree nodes
- Do not modify invariants.md

## Tests

- Add tests to `src/__tests__/shift-summary.test.ts` for the new fields
- Test tick distribution counting
- Test review loop detection

## Decision Rationale

The reworked insight suggested building on existing mechanisms (shift summary → assessment → explore) rather than adding a new tree node. This is the minimal implementation that enables meta-process improvement.
