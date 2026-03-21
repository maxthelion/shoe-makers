---
title: Pure Function Agents
category: architecture
tags: [agents, pure-functions, execution, octopoid]
summary: Agents as pure functions — receive input, write files to a branch, exit. No side effects. Preserved from Octopoid.
last-modified-by: user
---

## The Idea

This is the best idea from [[existing-projects#octopoid|Octopoid]], preserved here. An agent is a **pure function**:

- Receives: a read-only snapshot of the repo + a specific job description (determined by the [[behaviour-tree]] path)
- Produces: file changes on the shoemakers branch
- Side effects: **none**

The agent never pushes branches, creates PRs, calls APIs, or modifies state outside its working directory. All side effects are handled by the scheduler after the agent exits.

## Why Pure Functions?

1. **Can't corrupt state** — if an agent crashes, nothing is left in an inconsistent state
2. **Testable** — give it inputs, check outputs
3. **Composable** — the scheduler can chain agents without them knowing about each other
4. **Debuggable** — the agent's output is just files on a branch, fully inspectable
5. **Replaceable** — swap in a different LLM, a different prompt, a human — the interface is the same

## Agent Interface

```
Input:
  - repo: read-only snapshot (worktree or checkout)
  - job: string describing what to do (from behaviour tree)
  - context: relevant data (health scores, test results, wiki excerpts)

Output:
  - files: changes written to the shoemakers branch
  - log: what the agent did and why (for the report)
  - status: done | partial | failed
```

## The Scheduler's Job

After an agent exits, the scheduler handles all side effects:

1. Commit the agent's changes to the shoemakers branch
2. Run tests against the new state
3. If tests pass and the [[verification]] gate passes, create a PR or merge
4. If tests fail, revert the commit
5. Update the wiki with what happened

The agent doesn't know or care about any of this.

## Partial Work

An agent that runs for 4 minutes and produces partial work is fine. It writes what it has to the branch and exits with `status: partial`. Next tick, the [[behaviour-tree]] sees "unfinished work on the branch" and invokes `ContinueAgent` to pick up where the last agent left off.

This eliminates timeouts and stuck tasks — partial progress is always preserved, and the system naturally resumes.
