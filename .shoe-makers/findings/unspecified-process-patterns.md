# Unspecified process-patterns self-monitoring loop

## Observation

The system contains a self-monitoring loop that parses the shift log each tick, extracts machine-readable patterns, and uses them to alter tree routing and explore prompts. None of this is described in the invariants or wiki pages.

### 1. Shift log parsing → processPatterns

`src/log/shift-log-parser.ts` exports `computeProcessPatterns()` which parses the shift log to extract:
- `reviewLoopCount` — consecutive critique→fix cycles without reaching explore
- `reactiveRatio` — proportion of actions that are reactive (fix-tests, fix-critique, review) vs. proactive (explore, prioritise, execute)
- `innovationCycleCount` — number of innovate actions in the current shift

These are stored in `assessment.processPatterns` and written to `.shoe-makers/state/blackboard.json`.

### 2. Review-loop-breaker tree nodes

`src/tree/default-tree.ts` lines 31-34 define two tree nodes with no spec coverage:
- `review-loop-with-candidates`: if `reviewLoopCount >= 3` and candidates exist, skip explore and go straight to `prioritise`
- `review-loop-breaker`: if `reviewLoopCount >= 3` (no candidates), force `explore` to break the cycle

The threshold of 3 is a meaningful design decision that is invisible to spec readers.

### 3. Process temperature guidance in explore prompts

`src/prompts/explore.ts` lines 16-37 inject "process temperature" guidance into the explore prompt based on `reactiveRatio`:
- High ratio (> 0.6): suggests looking at proactive improvements
- Low ratio (< 0.3): suggests checking for reactive needs

This alters what the explore elf focuses on, based on shift history.

### 4. Innovation cycle cap

`src/tree/default-tree.ts` lines 73-77 use `innovationCycleCount` to cap innovation cycles per shift (default 3, configurable via `max-innovation-cycles` in config.yaml — also unspecified in invariants section 5.2). After the cap is reached, the tree stops routing to `innovate` even if all other conditions for innovation tier are met.

## Why it matters

This self-monitoring loop is a core architectural feature — it prevents the system from getting stuck in review loops, balances reactive vs. proactive work, and caps innovation cycles. Without spec coverage:
- Future elves or humans modifying the tree may not understand why these nodes exist
- The review-loop threshold of 3 is a tuning parameter with no documented rationale
- The process temperature concept is invisible to anyone reading the spec

## Recommendation

Human should add invariants covering:
1. Section 2.2: Add `review-loop-breaker` and `review-loop-with-candidates` as reactive conditions with their threshold behaviour
2. Section 2.5 or new section: Document `processPatterns` (reviewLoopCount, reactiveRatio, innovationCycleCount) as derived state from shift log parsing
3. Section 2.6: Document the innovation cycle cap and its configurability
4. Section 3.4: Document that the shift log is machine-parsed each tick (not just human-readable narrative)
5. Section 5.2: Add `insight-frequency` and `max-innovation-cycles` as configurable keys

## Status

Open — requires human action (elves cannot modify invariants.md).
