---
title: Plans vs Spec
category: architecture
tags: [plans, specification, wiki, invariants, lifecycle]
summary: Plans patch the delta between what's built and what we want. Once built, they become spec.
last-modified-by: user
---

## Two Types of Wiki Content

### Specification

What the system **is**. Factual, verifiable, the source for [[invariants]].

- "The API returns paginated results"
- "The file watcher debounces by 2 seconds"
- "Health scores weight complexity at 25%"

The invariants pipeline extracts falsifiable statements from spec pages and compares them against code.

### Plans

What we **want the system to become**. A plan patches the delta between the current spec (what's built) and a desired future state.

- "Add vector search using qmd"
- "Split the monolith into API and worker"
- "Support multiple wiki instances"

Plans are temporary. They exist only while there's a gap between what is and what should be.

## Lifecycle

```
Idea → Plan → Implementation → Spec
```

1. An idea gets written as a **plan** in the wiki
2. Agents (or humans) **implement** the plan
3. Once built and verified, the plan content migrates into **spec** pages
4. The plan is archived or deleted — it served its purpose
5. The [[invariants]] pipeline now extracts verifiable statements from the new spec

A plan that's been fully implemented but still exists as a plan is a smell — it means the spec hasn't been updated.

Plans can have a `status` field in frontmatter:
- No status (default) → open, generates work candidates
- `status: blocked` → plan exists but remaining work is blocked (e.g., needs external dependency). Excluded from open plans.
- `status: done` → plan is complete. Should be archived to spec or deleted. Excluded from open plans.

## How Agents Use This

The [[behaviour-tree]] treats plans and spec differently:

- **Spec** feeds the invariants report → drives ImplementAgent, TestAgent, DocSyncAgent
- **Plans** are higher-level intent → an agent reads a plan to understand *what to build*, then updates the spec as it builds it

A plan might say "add full-text search." The agent implements it, then updates the spec pages to describe how search works. The invariants pipeline then verifies the new spec against the code.

## In OctoWiki

OctoWiki already has a planning system — the Inbox/Feed/Plan workflow. Plans live in `.meta/plans/`. This maps naturally:

- Wiki pages with `category: spec` → specification (invariant source)
- Wiki pages with `category: plan` → plans (delta to be closed)
- The planning agent creates plans; the execution agent closes them by building + updating spec

See also: [[wiki-as-spec]], [[invariants]], [[behaviour-tree]]
