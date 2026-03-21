---
title: Verification
category: architecture
tags: [verification, qa, gatekeeper, adversarial]
summary: The verification pipeline — how agent work gets independently reviewed before merging.
last-modified-by: user
---

## Why Verification Matters

The [[vision]] emphasises that agents working overnight can take their time. The corollary: they should use that time to be *thorough*. Verification is a separate concern from execution — the executor and verifier should be adversarial.

## Two-Phase Approach

### Option A: Same run, different phase
The protocol instructs the agent to switch to "gatekeeper mode" after making changes. Simpler but it's the same model critiquing itself.

### Option B: Two scheduled tasks (preferred)
1. **1am task**: Executor — does the work, creates draft PRs
2. **3am task**: Gatekeeper — reviews all draft PRs adversarially, approves or closes them

This maps to the executor/gatekeeper split from [[existing-projects#octopoid|Octopoid]] which was a genuinely good architectural idea.

## Verification Pipeline

For each piece of work, the verifier runs:

1. **Automated checks**
   - Full test suite passes
   - Octoclean diff — did health score actually improve (or at least not regress)?
   - Linting passes
   - Type checking passes

2. **LLM-based review**
   - Adversarial review: "find problems with this diff"
   - Intent alignment: "does this change serve the project's goals?"
   - Architectural contract check: "does this violate any stated constraints?"

3. **Hard gate**
   - ALL automated checks must pass
   - LLM review must not find blocking issues
   - If gate fails: revert/close the PR, report explains what was attempted and why it was rejected

## From Octopoid

Octopoid's gatekeeper agent ran multi-round review (up to 3 rounds). A task could bounce between implementer and gatekeeper. This is worth preserving — if the gatekeeper finds minor issues, the executor could get another shot rather than outright rejection.
