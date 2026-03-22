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
- Agent process management

Instead, shoe-makers provides the **intelligence layer** — the [[architecture|behaviour tree protocol]] that tells the scheduled task *what* to do and *how* to verify it.

The scheduled task's prompt points at `.shoe-makers/protocol.md` in the repo, which contains the full decision-making logic.

## Working Hours

Shoe-makers supports an optional working-hours schedule (`src/schedule.ts`):

- **`.shoe-makers/schedule.md`** configures start/end hours in UTC 24h format
- If outside working hours, the setup script exits immediately
- If no schedule file exists, the shoemakers work any time
- Overnight shifts that cross midnight (e.g. start: 22, end: 6) are supported

## Branch Management

The setup script (`src/setup.ts`) handles branch lifecycle:

- Creates or checks out a branch named `{branchPrefix}/{shift-date}` (e.g. `shoemakers/2026-03-22`)
- Fetches from origin and pulls if the branch exists remotely
- The shift date uses yesterday's date if we're past midnight but before the shift end hour (midnight-wrap support)
