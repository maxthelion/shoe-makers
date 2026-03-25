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

The invariants pipeline extracts falsifiable claims and checks them against code:

### Claim Extraction
Claims are identified from wiki pages — each is a falsifiable statement about system behaviour (e.g. "the tree evaluates selector nodes by trying each child in order").

### Evidence Matching
For each claim, source code and test files are searched for evidence patterns. Each claim has AND-of-OR evidence groups — all groups must have at least one match.

### Status Assignment
Each claim gets one of four statuses based on evidence found:
- **specified-only**: wiki describes it but no code evidence
- **implemented-untested**: code exists but no test evidence
- **implemented-tested**: both code and test evidence found
- **unspecified**: code exists but wiki doesn't describe it

## How Shoe-Makers Uses This

The invariants report is the primary **world state** for the [[behaviour-tree]]. The ASSESS tick runs the invariants check, the PRIORITISE tick uses the results to rank work. If the invariants check finds gaps, there is always work to do. **The system should never sleep while there are specified-only or implemented-untested invariants.**

The report also feeds [[verification]] — after an agent makes changes, re-run the invariants pipeline to confirm the change actually moved the right invariant from one status to another.

## Granularity Matters

The invariants check must be granular enough to find real gaps. Mapping a wiki page to a source directory and saying "code exists" is not enough. A wiki page may describe 10 distinct behaviours — if only 3 are implemented, the other 7 should show as `specified-only`.

### Current Implementation: Per-Claim Evidence Matching

The current implementation extracts **50 individual claims** from wiki pages and checks each one against source code and test evidence. Each claim has:

- **Source evidence**: AND-of-OR groups of patterns to find in source files (comments stripped)
- **Test evidence**: AND-of-OR groups of patterns to find in test files

Each group is a set of alternatives (OR) — any match suffices. All groups must match (AND). This gives precise control: `[["case \"selector\""], ["children"]]` means the code must contain both a selector case and children handling.

The claim-to-evidence mapping is manually curated in `src/verify/invariants.ts`. As the system evolves, claims and evidence patterns are updated to match the current architecture.

## Signal Liveness

The assessment cache contains multiple data sources: invariant counts, test results, health scores, Wikipedia articles for creative exploration. Any of these can fail silently — returning null instead of a value. A null health score currently means "skip the health check", which masks broken infrastructure.

**Null is not neutral — null is a failure.** If a signal that should produce a value returns null, the assessment must record this explicitly (e.g. `healthScore: null, healthScoreError: "octoclean not installed"`). The behaviour tree should treat missing signals as a condition to investigate, not a condition to ignore. This prevents the system from confidently innovating while one of its sensors is broken.

## The Virtuous Cycle

1. Human writes wiki pages describing intent
2. Invariants pipeline extracts falsifiable statements
3. Agents implement `specified-only` items
4. Agents test `implemented-untested` items
5. Agents document `unspecified` items
6. Coverage improves → wiki becomes more accurate → agents become more effective

See also: [[wiki-as-spec]], [[behaviour-tree]], [[verification]]
