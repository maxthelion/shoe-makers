---
title: Scheduled Tasks
category: reference
tags: [claude-code, scheduled-tasks, infrastructure]
summary: Claude Code's scheduled cloud tasks — the infrastructure layer that shoe-makers builds on top of.
last-modified-by: user
---

## What It Is

Claude Code (as of March 2026) supports scheduling recurring cloud-based tasks. You set a repo (or repos), a schedule, and a prompt. Claude runs it via cloud infra on your schedule — no local machine needed.

Announced by Noah Zweben (Anthropic): https://x.com/noahzweben/status/2035122989533163971

Available at: https://claude.ai/code/scheduled or via the Claude desktop app.

## What It Provides

- Cron-style scheduling
- Cloud execution (no local machine running)
- Git repo access
- MCP server access (any MCPs connected via claude.ai)

## Use Cases (from Anthropic)

- Sweeping through open PRs
- Building features from approved issues
- Analyzing CI failures overnight
- Syncing docs based on newly merged PRs

## How Shoe-Makers Uses It

This is the **execution layer**. Shoe-makers doesn't need to build:
- Cron scheduling
- Cloud execution environment
- Git worktree management
- Agent process management

Instead, shoe-makers provides the **intelligence layer** — the [[architecture|behaviour tree protocol]] that tells the scheduled task *what* to do and *how* to verify it.

The scheduled task's prompt points at `.shoe-makers/protocol.md` in the repo, which contains the full decision-making logic.
