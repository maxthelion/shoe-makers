# Review-loop breaker was blocking all proactive work

## Observation

The `inReviewLoop` condition in `src/tree/default-tree.ts` only checked `reviewLoopCount >= 3` from the shift log. Since `reviewLoopCount` is cumulative for the entire shift and never resets, once 3 review loops occurred early in the shift, the breaker fired on every subsequent tick — routing to explore indefinitely and preventing the tree from reaching candidates, prioritise, or execute.

## Fix

Added a `wouldLoop` guard: the breaker now only fires when there are actually unresolved critiques or unreviewed commits that would cause looping. When neither condition is true, the breaker doesn't fire and the tree falls through to proactive work normally.

## Status

Resolved — fix committed with tests.
