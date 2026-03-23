# Innovation Tier: Deterministic Creative Briefs

## Problem

When the codebase reaches "peak health" (all invariants met, tests pass, health score high), the explore elf enters innovation tier. The prompt tells it to think like a product owner and find improvements, but the elf consistently outputs "no impactful work remaining" and doesn't write candidates.md. This creates an idle loop — explore fires every tick, produces nothing, repeat.

The creative exploration pipeline (Wikipedia random articles, insight files, evaluation lifecycle) is fully built but has produced zero insight files. The insights directory is empty.

The root cause: the elf is asked to be creative from a standing start with no concrete material to react to. LLMs are better at responding to specific prompts than generating novelty unprompted.

## Background: Random Conceptual Collision

From the [blog post on inspiring agents](https://blog.maxthelion.me/blog/inspiration/): human creativity emerges through random conceptual collision — encountering unrelated ideas and unconsciously connecting them. Agents lack this ambient exposure. The fix is to deliberately provide random outside concepts and force the agent to connect them to the system.

The existing Wikipedia pipeline does this mechanically (fetch random article), but it fires only 30% of the time, is optional, and sits inside a prompt that also asks the elf to do gap analysis. The elf ignores it.

## Design

### Two new action types

#### `innovate`

A dedicated action for creative insight generation. Replaces `explore` as the bottom-of-tree fallback when innovation tier is detected.

**Setup (deterministic) prepares the brief:**

1. Detect innovation tier: all invariants met, health score above threshold, no spec-only or untested claims above threshold (same logic as the existing `eHasGaps` check)
2. Read `wiki/pages/architecture.md` and any other overview wiki pages to build a system summary
3. Always fetch a random Wikipedia article via `fetchRandomArticle()` (100%, not 30%)
4. Write `next-action.md` with both embedded

**The prompt mandates output:**

The elf receives:
- A summary of what the system is and does (from the wiki)
- A random concept from the world (from Wikipedia)
- Instructions to write an insight file connecting them

The prompt is explicit: you MUST write an insight file. "No connection found" is not acceptable output. Most ideas will be bad — that's fine. The elf is in divergent/creative mode. Its job is to make the connection, not to judge it.

**Output:** An insight file written to `.shoe-makers/insights/YYYY-MM-DD-NNN.md` with:
- The Wikipedia article that prompted it
- The connection to the system
- A concrete proposal for what could change
- Why it would be better than the current approach

(This format already exists in the creative-exploration.md spec.)

#### `evaluate-insight`

A dedicated action for evaluating insight files with a generous disposition. Separate from `prioritise` because the prioritise elf is pragmatic and will kill creative ideas.

**When it fires:** insight files exist in `.shoe-makers/insights/`.

**The prompt's disposition is constructive, not gatekeeping:**

The evaluator:
1. Reads the insight
2. Engages with it: could this work? If not as stated, is there a variant that would?
3. Builds on the idea — rewrites weak proposals into stronger ones
4. Decides:
   - **Promote**: the idea (or improved version) is viable — write a `work-item.md`
   - **Rework**: the core insight is interesting but needs development — rewrite the insight file with the improved version for a future evaluator
   - **Dismiss**: genuinely inapplicable — delete, log why in the shift log. This should be the exception, not the default.

The key difference from `prioritise`: the evaluator's job is to make the idea better, not to decide if it's worth doing. "This wouldn't work because X, but Y would work" is the expected output shape.

### Tree changes

The behaviour tree's bottom section changes from:

```
├── [candidates?]    -> prioritise
└── [always]         -> explore
```

To:

```
├── [candidates?]       -> prioritise
├── [insights exist?]   -> evaluate-insight    (new)
├── [innovation tier?]  -> innovate            (new)
└── [has gaps?]         -> explore             (existing, now conditional)
```

**Node details:**

- `insights exist?` — checks `insightCount > 0` in WorldState (field already exists, currently hardcoded to 0 in setup.ts — needs to actually read the insights directory)
- `innovation tier?` — checks that invariants are met and health is good (same logic as the existing tier check in prompts.ts, extracted to a reusable function)
- `has gaps?` — the negation of innovation tier; explore only fires when there's hygiene/implementation work to find
- If somehow neither innovation tier nor gaps apply, explore fires as ultimate fallback (should not happen in practice)

### Changes to setup.ts

The `buildWorldState` function currently hardcodes `insightCount: 0`. It needs to actually count files in `.shoe-makers/insights/` (the `readWorldState` function in `state/world.ts` already does this — setup should use the same logic).

When the tree evaluates to `innovate`, setup:
1. Reads wiki overview pages from disk (deterministic, no LLM)
2. Fetches a random Wikipedia article (always, not conditional)
3. Embeds both into the prompt via `generatePrompt`

### Changes to prompts.ts

Two new cases in `generatePrompt`:

- `innovate` — the creative brief with wiki summary + Wikipedia article + mandatory insight output
- `evaluate-insight` — the generous evaluator prompt

The existing `explore` case stays unchanged for hygiene/implementation tier.

### Changes to types.ts

Add `"innovate" | "evaluate-insight"` to the `ActionType` union.

### What does NOT change

- The insight file format (already specified in creative-exploration.md)
- The Wikipedia fetch mechanism (already built in `src/creative/wikipedia.ts`)
- The prioritise action (still handles candidates as before)
- The explore action (still handles gap-finding as before, just no longer fires at innovation tier)

## Files to modify

1. `src/tree/default-tree.ts` — add `innovate`, `evaluate-insight` nodes, make `explore` conditional
2. `src/prompts.ts` — add `innovate` and `evaluate-insight` prompt cases
3. `src/setup.ts` — read wiki pages for innovate brief, fix `insightCount: 0` hardcoding, always fetch article for innovate
4. `src/types.ts` — extend `ActionType`
5. `src/state/world.ts` — add `isInnovationTier()` helper (extract from prompts.ts tier logic)
6. Tests for all of the above
