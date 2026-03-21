---
title: Wiki as Spec
category: architecture
tags: [wiki, invariants, specification, verification, octowiki, source-of-truth]
summary: The wiki is the source of truth — code is a derived product of the specification, not the other way around.
last-modified-by: user
---

## Code is Derived from the Spec

Every application has an implicit truth about what it is meant to be. Usually this lives scattered across code, tickets, Slack threads, and people's heads. The wiki makes it **explicit and singular**.

If the specification is accurate enough, the application could be rebuilt from scratch — potentially with different technology. The code is a derived product. Test suites and QA processes are also derivable from it. This inverts the usual relationship where docs are treated as secondary to code.

Source: https://blog.maxthelion.me/blog/defining-the-source-of-truth/

## The Problem the Wiki Solves

Without an explicit spec:
- **Fragmented truth**: different stakeholders maintain separate views of what the product is
- **Implicit specification**: when building with agents, the code becomes the only source of truth — but code is a poor communicator of intent (like assembler)
- **Lost reasoning**: the *why* behind decisions disappears once a ticket is closed or a conversation ends
- **Competing realities**: what the system does vs what people want it to do become overlapping contradictory sets

## Practical Approach

Don't write aspirational specs that drift. **Maintain a spec of what actually exists.** Update the wiki after implementation to describe what was built and why.

This connects to [[plans-vs-spec]]: plans describe what we want, specs describe what we have. When a plan is implemented, the spec is updated. The plan is then archived.

## Wiki Organisation

The wiki is organised by topic, fractally — each area can be described at whatever depth is needed:

- **Functionality**: what users can do
- **UI**: how controls are presented
- **Architecture**: how the system is structured
- **Algorithms and data structures**: how data is manipulated

This supports agent workflows — focused context windows get relevant pages, not an overwhelming monolith.

## The Set Comparison

The [[invariants]] pipeline compares two sources of truth:

- **What the wiki says** (the spec)
- **What the code does** (the implementation)

This produces four statuses:

| Status | Meaning | Action |
|--------|---------|--------|
| `implemented-tested` | Wiki says it, code does it, tests prove it | Nothing to do |
| `implemented-untested` | Wiki says it, code does it, no test | Write tests |
| `specified-only` | Wiki says it, can't find it in code | Implement it |
| `unspecified` | Code does it, wiki doesn't mention it | Update wiki |

## Three Questions

The invariants report answers three questions that drive all agent work:

1. **Is everything described in the wiki implemented?** → `specified-only` count
2. **Is everything implemented properly tested?** → `implemented-untested` count
3. **Is the wiki out of date?** → `unspecified` count

These replace ad-hoc condition checks in the [[behaviour-tree]]. The invariants report IS the world state.

## Agents Maintain the Wiki

The agents don't just read the wiki — they keep it current. The [[behaviour-tree]] routes to:

- **ImplementAgent** when there are `specified-only` invariants
- **TestAgent** when there are `implemented-untested` invariants
- **DocSyncAgent** when there are `unspecified` invariants

This creates a virtuous cycle: the wiki gets more accurate → the invariants report gets more useful → the agents get more effective.

## Bootstrapping

For existing codebases, OctoWiki has a batch import system that:
1. Searches existing markdown files for relevant content
2. Analyses the codebase for undocumented behaviour
3. Creates wiki pages categorised by topic
4. Checks invariant compliance

This solves the cold-start problem — you don't need to write the entire spec by hand before the system is useful.

See also: [[invariants]], [[plans-vs-spec]], [[behaviour-tree]], [[pure-function-agents]]
