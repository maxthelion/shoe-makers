---
title: Creative Exploration
category: spec
tags: [exploration, creativity, analogies, lenses, wikipedia, taste]
summary: How agents access their latent design knowledge through random analogical prompting — forced serendipity for better solutions.
last-modified-by: user
---

## The Problem

Agents are goal-centric. Given "implement this invariant," they reach for the most direct solution. They never step back and think "there's a fundamentally better way to approach this." But LLMs have seen millions of solutions in training — they have deep design knowledge they can't access unbidden because every prompt is transactional.

Humans reason through analogy. A fairy tale suggests autonomous overnight agents. A game suggests behaviour trees. A basketball selection process suggests consensus-based verification. These connections happen because humans encounter random ideas as they exist in the world. Agents don't have that — they exist only when invoked, with only the context they're given.

## Random Analogical Prompting

During the [[behaviour-tree|explore phase]], the system fetches a random Wikipedia article and presents it to the elf as a lens:

*"Here is a random concept: [article summary]. Read the shoe-makers codebase. Does anything about this concept remind you of a pattern, approach, or problem in the codebase? Could any aspect of this concept inspire a better solution to something we're building? Think laterally — the connection might be abstract."*

Most of the time: nothing useful. That's fine. Brainstorming has a low hit rate. But occasionally the random article triggers a genuine insight — a connection the elf's training data supports but that would never surface from a goal-directed prompt.

## How It Works

### Wikipedia lens in `explore`

During regular `explore` actions, a Wikipedia lens is included **probabilistically** — controlled by the `insight-frequency` config (default `0.3`, meaning 30% of explore cycles). When included, the elf receives a random Wikipedia article as a creative lens alongside the normal exploration prompt. If the elf discovers a non-obvious connection, it writes an insight file to `.shoe-makers/insights/`. This is optional — the elf's primary job during explore is still to write candidates.

The `insight-frequency` is set in `.shoe-makers/config.yaml`.

### The `innovate` action

Creative exploration is a dedicated action in the behaviour tree, not an optional add-on to explore. When the system reaches innovation tier (all invariants met, health good), the tree routes to `innovate` instead of `explore`.

The setup script prepares a **deterministic creative brief**:

1. Reads the wiki overview pages (`architecture.md`, etc.) to build a summary of what the system is and does
2. Fetches a random Wikipedia article summary via the API (always — not probabilistic):
   ```
   https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json
   ```
3. Writes both into `next-action.md` as a mandatory brief

The elf receives the system overview and the random concept, and **must** write an insight file. "No connection found" is not acceptable output. Most ideas will be bad — that's fine. The elf is in divergent/creative mode. Its job is to make the connection, not to judge it.

The insight is written to `.shoe-makers/insights/YYYY-MM-DD-NNN.md` with:
- The Wikipedia article that prompted it
- The connection to the system
- A concrete proposal for what could change
- Why it would be better than the current approach

### Insights vs Findings

Insights are different from findings:
- **Findings** are observations about problems: "this is broken," "this is missing," "this diverges from spec"
- **Insights** are creative proposals: "what if we approached X like Y instead?"

Insights go in `.shoe-makers/insights/`, not `.shoe-makers/findings/`. They don't block work or trigger fix-critique actions. They're proposals, not problems.

### The `evaluate-insight` action

Insights are not acted on by the elf that wrote them. A separate `evaluate-insight` action fires when insight files exist. This evaluator has a **generous disposition** — its job is to build on ideas, not filter them. It is deliberately separate from the pragmatic `prioritise` action.

The evaluator engages with the idea constructively:

1. **Evaluate**: could this actually work? What are the practical obstacles?
2. **Build on it**: if the idea as stated wouldn't work, is there a variant that would? The evaluator should say "this wouldn't work because X, but this other idea Y would work" and rewrite accordingly.
3. **Decide**:
   - **Promote**: the idea (or improved version) is viable → create a work-item.md
   - **Rework**: the core insight is interesting but needs development → rewrite the insight file with the improved version for a future elf to evaluate again
   - **Dismiss**: genuinely inapplicable → delete with a note in the shift log. This should be the exception, not the default.

The separation between generating an insight and evaluating it is deliberate. The innovate elf is in creative/divergent mode — its job is to make connections without judging them. The evaluate-insight elf is in constructive/convergent mode — its job is to stress-test, improve, and build on the idea. Good evaluation doesn't just filter ideas, it transforms them.

This two-phase process means the creative elf can be wild and speculative (most ideas will be bad, and that's fine), while the evaluating elf applies rigour without killing creativity. The raw insight is never the final form — it's a seed that the evaluator develops into something actionable.

The evaluator is NOT the prioritise elf. The prioritise elf is pragmatic — it optimises for immediate impact and would kill most creative ideas. The evaluate-insight elf has a different disposition: generous, constructive, looking for the version of the idea that works.

### Example

The random article is about **consensus All-Americans in basketball** — players selected by a majority of independent selectors.

The elf writes an insight:

> **Lens**: Consensus All-Americans — status determined by agreement across multiple independent selectors, not a single authority.
>
> **Connection**: Our invariant evidence currently relies on a single check (string pattern matching). A claim is "implemented" if one pattern matches. This is like one voter picking the team — easy to game.
>
> **Proposal**: Require consensus across multiple evidence types: code pattern exists AND a test exercises it AND a reviewer has confirmed it AND/OR a behavioural check passes. A claim is only "implemented-tested" when a majority of independent checks agree. This would make gaming much harder.

A future prioritiser reads this, decides it's worth doing, and writes a work-item.md with specific implementation instructions.

## State

```
.shoe-makers/
  insights/           ← creative proposals from random prompting
    2026-03-22-001.md
    2026-03-22-002.md
```

## Innovate Is Not Explore

The `innovate` action is separate from `explore`. Explore handles tiers 1 and 2 — finding gaps, surfacing spec-code inconsistencies, writing candidates for pragmatic work. Innovate handles tier 3 — creative improvement when the codebase is already healthy.

The key difference: the setup script prepares a **deterministic brief** for innovate. The elf doesn't decide whether to be creative — the brief already frames the question. The elf just has to answer it. This prevents the failure mode where the elf says "nothing to do" because it wasn't given concrete material to react to.

See also: [[behaviour-tree]], [[invariants]], [[verification]]
