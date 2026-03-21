---
title: Existing Projects
category: reference
tags: [octowiki, octoclean, octopoid, projects]
summary: The existing projects being consolidated into shoe-makers — OctoWiki, Octoclean, and Octopoid.
last-modified-by: user
---

## OctoWiki

AI-powered wiki for codebases. Watches markdown pages, summarises changes with Claude, supports chat-with-pages, planning, and autonomous execution.

- **Repo**: https://github.com/maxthelion/octowiki
- **Role in shoe-makers**: The "brain" — provides project intent, architectural context, and documentation. Also the reporting layer where agents log what they did.
- **Integration**: MCP server, or directly as the wiki content lives in the repo

Key features: wikilinks (8 types), file watcher with dual debounce, chat per page, planning & execution pipeline, search (BM25 + vector via qmd).

## Octoclean

Code quality analysis for JS/TS repos. Scans codebases, tracks health over time, surfaces issues. Does not fix anything itself — pairs with agents for that.

- **Repo**: https://github.com/maxthelion/octoclean
- **Role in shoe-makers**: Assessment skill — provides the data for "what needs improving". Health scores drive prioritisation.
- **Integration**: As a [[skills|skill]] that the behaviour tree invokes during the Assess phase

Key features: health score (0-100) across complexity, coverage, duplication, churn. LLM assessments for naming, docstrings, competing implementations. Autoresearch pairing for automated fixes.

## Octopoid

Previous attempt at a distributed AI orchestrator. Multi-machine, Cloudflare Workers + D1, agent pools, flow state machines.

- **Repo**: https://github.com/maxthelion/octopoid
- **Role in shoe-makers**: Lessons learned. The executor/gatekeeper split was a good idea. The distributed infrastructure was too much.
- **What to keep**: Adversarial gatekeeper pattern, worktree-per-task, agent role definitions
- **What to drop**: Multi-machine coordination, D1 server, complex flow state machines, pool management

### Lessons from Octopoid

| Good idea | Keep in shoe-makers? |
|-----------|---------------------|
| Worktree per task | Yes (Claude Code handles this) |
| Executor/gatekeeper split | Yes — see [[verification]] |
| Agent role definitions | Yes — becomes [[skills]] |
| Declarative flow state machines | No — behaviour tree is simpler |
| Distributed multi-machine | No — single scheduled task |
| D1 server + API | No — git is the state |
| Pool management | No — Claude Code manages agents |
