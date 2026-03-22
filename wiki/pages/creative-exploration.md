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

### In the explore phase

1. The setup script fetches a random Wikipedia article summary via the API:
   ```
   https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json
   ```
   Then fetches the extract for that article.

2. The explore prompt includes the article summary alongside the normal assessment instructions.

3. If the elf sees a connection, it writes an **insight** to `.shoe-makers/insights/YYYY-MM-DD-NNN.md` with:
   - The Wikipedia article that prompted it
   - The connection to the codebase
   - A concrete proposal for what could change
   - Why it would be better than the current approach

4. If no connection, the elf moves on to normal exploration. No penalty for finding nothing.

### Insights vs Findings

Insights are different from findings:
- **Findings** are observations about problems: "this is broken," "this is missing," "this diverges from spec"
- **Insights** are creative proposals: "what if we approached X like Y instead?"

Insights go in `.shoe-makers/insights/`, not `.shoe-makers/findings/`. They don't block work or trigger fix-critique actions. They're proposals, not problems.

### Review by a future elf

Insights are not acted on immediately. They sit until a future elf encounters them during the prioritise phase. The prioritiser reads insights alongside candidates and decides:
- **Promote**: this is worth doing — create a work-item.md based on it
- **Defer**: interesting but not a priority right now — leave it for later
- **Dismiss**: not applicable — delete with a note in the shift log explaining why

The separation between generating an insight and acting on it is deliberate. The exploring elf is in creative/divergent mode. The prioritising elf is in evaluative/convergent mode. Different mental states, different invocations.

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

## Not Every Explore Gets a Lens

Random prompting should happen occasionally, not every explore cycle. Perhaps one in three explore invocations includes a Wikipedia article. The rest do normal gap analysis. This keeps the system productive while allowing space for creativity.

The frequency could be configured in `.shoe-makers/config.yaml`:
```yaml
insightFrequency: 0.3  # 30% of explore cycles include a random lens
```

See also: [[behaviour-tree]], [[invariants]], [[verification]]
