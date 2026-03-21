---
title: Invariants
category: architecture
tags: [invariants, verification, set-comparison, octowiki]
summary: The invariants system — extracting falsifiable statements from wiki and code, comparing them to find gaps.
last-modified-by: user
---

## What Are Invariants?

An invariant is a **falsifiable statement** about the system. For example:

- "POST /api/pages creates a new markdown file in wiki/pages/"
- "The file watcher debounces SSE notifications by 2 seconds"
- "Chat history is limited to the last 10 exchanges"

Each invariant has:
- **ID**: dotted path (e.g. `http.post-pages-creates-file`)
- **Kind**: behavioural or architectural
- **Verification method**: unit-test, integration-test, visual-qa, manual-check, static-analysis
- **Sources**: which wiki pages define it

## The Pipeline

Four stages, each with context isolation (one source can't bias the other):

### Stage 0: Synthesise Code
Bundle source code by subsystem, use Sonnet to produce a holistic system description. This grounds extraction in actual behaviour.

### Stage 1: Extract Invariants
Feed the code-derived description + wiki pages to Sonnet. Extract falsifiable invariants organised in a hierarchy.

### Stage 2: Find Evidence
For each invariant group, search source code and tests for evidence. Produces implementation locations and test coverage data. Also discovers **unspecified** behaviour — things the code does that the wiki doesn't mention.

### Stage 3: Compare
Deterministic merge of the invariant tree and evidence. Assigns statuses, calculates coverage per group. Renders markdown pages.

## How Shoe-Makers Uses This

The invariants report is the primary **world state** for the [[behaviour-tree]]. Instead of ad-hoc checks, the tree queries the report:

```
├── Any specified-only invariants? → ImplementAgent
├── Any implemented-untested invariants? → TestAgent
├── Any unspecified invariants? → DocSyncAgent
```

The report also feeds [[verification]] — after an agent makes changes, re-run the invariants pipeline to confirm the change actually moved the right invariant from one status to another.

## The Virtuous Cycle

1. Human writes wiki pages describing intent
2. Invariants pipeline extracts falsifiable statements
3. Agents implement `specified-only` items
4. Agents test `implemented-untested` items
5. Agents document `unspecified` items
6. Coverage improves → wiki becomes more accurate → agents become more effective

See also: [[wiki-as-spec]], [[behaviour-tree]], [[verification]]
