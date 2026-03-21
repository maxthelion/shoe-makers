---
title: Agent Work Execution
category: plan
status: done
tags: [agents, work, execution, self-hosting]
summary: Bridge the gap between the work skill's instructions and actual code changes. The last mile for self-hosting.
last-modified-by: elf
---

## The Gap

The shift runner (`bun run shift`) cycles through assess → prioritise → work → verify. When it reaches **work**, it:

1. Picks the top priority item
2. Looks up the matching skill definition
3. Writes `current-task.json` with status `in-progress`
4. Returns structured instructions (task prompt + skill constraints)
5. **Pauses** — nothing executes the instructions

Currently, `protocol.md` tells the elf to read the instructions and act manually. For self-hosting, the system needs to invoke a pure-function agent programmatically.

## What to Build

### Phase 1: Task Completion Protocol

The work skill should write a structured task file that the shift runner can detect and act on. After the elf (or future agent) completes work:

1. Update `current-task.json` status from `in-progress` to `done` (or `failed`)
2. The next shift tick will route to **verify** automatically
3. Verify runs tests, decides commit/revert, clears state

This is mostly working already. The gap is step 1 — there's no `bun run complete-task` command to mark work done.

### Phase 2: Task Lifecycle Commands

Add CLI commands for the task lifecycle:

- `bun run task:status` — show current task details and instructions
- `bun run task:done` — mark current task as completed (triggers verify on next tick)
- `bun run task:fail [reason]` — mark current task as failed

These make the protocol simpler and less error-prone for elves.

### Phase 3: Agent Invocation (Future)

Once the task lifecycle is clean, the work skill can invoke a pure-function agent:

1. Work skill prepares agent input (repo snapshot, job description, context)
2. Agent produces file changes + log + status
3. Scheduler commits changes, runs verify

This requires LLM API access and is out of scope for bootstrap. The task lifecycle commands (Phase 1-2) are the foundation.

## Success Criteria

- [x] `bun run task:status` shows current task or "no active task"
- [x] `bun run task:done` updates current-task.json status to "done"
- [x] `bun run task:fail` updates current-task.json status to "failed" with reason
- [x] After `task:done`, running `bun run shift` routes to verify
- [x] Full cycle works: shift → work → elf acts → task:done → shift → verify → assess
- [x] Phase 3: Agent invocation — resolved: the elf IS the LLM. No separate API call needed.
