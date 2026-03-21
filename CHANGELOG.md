# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Assess skill now reads findings from `.shoe-makers/findings/` — persistent observations from previous elves are included in the assessment and factored into prioritisation
- Task lifecycle CLI (`bun run task:status`, `task:done`, `task:fail`) — manage current task status from the command line
- Plan page for agent work execution (`wiki/pages/agent-work-execution.md`) — documents the work execution gap and task lifecycle design
- Shift runner (`bun run shift`) — runs multiple ticks in sequence, handles housekeeping automatically, pauses on work with instructions for the caller
- Skill registry — loads markdown skill prompts from `.shoe-makers/skills/` and matches them to priority types
- 5 skill markdown files: fix-tests, implement, test-coverage, doc-sync, health
- Work skill now includes skill-specific instructions (verification criteria, permitted actions, off-limits)
- README.md and CHANGELOG.md
- Config loader — reads `.shoe-makers/config.yaml` with defaults, wired into world state
- Shift logging — appends timestamped entries to `.shoe-makers/log/YYYY-MM-DD.md`
- `bun run tick` command to run one tick of the behaviour tree
- Verify skill — runs tests, checks task status, decides commit/revert, clears state for next cycle
- Work skill — picks top priority, writes current-task.json, returns agent instructions
- Prioritise skill — generates candidates from assessment, ranks by impact/confidence/risk heuristic
- Assess skill — gathers git activity, test results, wiki plans, invariants; writes assessment.json
- Granular invariants checker — extracts 50 individual claims from wiki pages, checks each against source code and test evidence using AND-of-OR pattern groups (replaces coarse topic-to-directory mapping)
- Scheduler tick — evaluates behaviour tree against world state, returns skill to invoke
- Blackboard I/O — reads/writes JSON state files for assessment, priorities, currentTask, verification
- World state reader — assembles WorldState from git info, blackboard, and config
- Behaviour tree evaluator — recursive selector/sequence/condition/action evaluation

### Changed
- Open plans now support `status: blocked` and `status: done` in frontmatter — blocked/done plans are excluded from work candidates
- Invariants checker now uses per-claim granularity instead of per-page mapping. System now correctly identifies 6 spec gaps and 2 untested claims instead of reporting 0 gaps and sleeping.

### Fixed
- Plan detection now checks frontmatter `category: plan` instead of filename matching
- Tick cycle loop: verify clears both currentTask and priorities to prevent infinite work loop
- Removed no-op `scheduled-tasks` from invariants mapping (page has `category: reference`, was filtered out anyway)
- Invariants checker strips comments and its own evidence mapping before scanning to prevent false positive matches
