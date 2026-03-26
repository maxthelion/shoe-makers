# Review-loop-breaker blocks work-item execution for entire shift

## Observation

When the review loop count reaches >= 3 (detected via `computeProcessPatterns()` from the shift log), the `review-loop-breaker` tree node sits above the `work-item` node in `src/tree/default-tree.ts:110,118`. This means:

1. Once the review loop threshold is crossed, the tree can never route to `execute-work-item`
2. The system enters an explore→prioritise→explore infinite cycle
3. A valid work-item.md can sit on disk for the rest of the shift without being executed

## Current behaviour

Tree order (from `src/tree/default-tree.ts:107-125`):
```
review-loop-with-candidates → prioritise  (line 109)
review-loop-breaker → explore             (line 110)
...
work-item → execute-work-item             (line 118)
```

When `reviewLoopCount >= 3` and candidates exist, it routes to prioritise. When candidates are consumed, it falls through to explore. Explore writes candidates again. Loop repeats.

## Impact

In the current shift (2026-03-26), after early review cycles pushed the loop count past 3, a doc-sync work-item was created but could never be executed. Multiple explore→prioritise cycles occurred with no useful output.

## Possible fixes

1. **Reset review loop count after explore**: Once the system has broken out of the review loop and explored, reset the counter so execution can resume
2. **Add work-item check above review-loop-breaker**: If a work-item exists and is not from the current review loop, allow execution
3. **Time-decay the review loop count**: Only count recent critique/fix-critique cycles, not the entire shift history

This is a design question for the human to decide — the current spec (`wiki/pages/verification.md:145`) describes the circuit breaker but doesn't address what happens after it fires.
