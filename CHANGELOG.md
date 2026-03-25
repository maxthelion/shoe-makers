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
- 9 skill markdown files: fix-tests, implement, test-coverage, doc-sync, health, bug-fix, dead-code, dependency-update, octoclean-fix
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
- `continue-work` action — detects and resumes partial work from previous elves via `.shoe-makers/state/partial-work.md`
- `innovate` action — creative exploration at innovation tier using random Wikipedia articles as conceptual lenses
- `evaluate-insight` action — generous evaluation of creative insights, separate from pragmatic prioritise
- `bun run setup` command — evaluates behaviour tree, writes focused prompt to `.shoe-makers/state/next-action.md`
- Review-loop breaker — tree breaks out of critique/fix-critique loops after 3 consecutive review actions
- Innovation cycle cap — `max-innovation-cycles` config limits creative cycles per shift (default: 3)
- `insight-frequency` config — controls probability of creative lens during explore (default: 0.3)
- Health regression detection — warns when octoclean health score drops between ticks
- State file archiving — consumed candidates and work items archived for traceability

- Wikipedia creative lens — random article as analogical thinking prompt for explore and innovate actions
- Innovation pipeline — dedicated `innovate` and `evaluate-insight` tree actions with separate dispositions (divergent/creative vs constructive/convergent)
- Health regression detection — warns when code health score drops between setup ticks
- Process pattern analysis — shift log parsing computes reactive ratio, review loop detection, and innovation cycle count
- Process temperature signals — explore and prioritise prompts adapt guidance based on shift's reactive ratio
- Permission violation detection — setup automatically detects when elves modify files outside their permitted scope
- State file archiving — consumed candidates and work items archived to `.shoe-makers/archive/state/` for traceability
- `insight-frequency` config — controls probability of creative lens appearing in explore ticks (default 0.3)
- `max-innovation-cycles` config — caps innovation cycles per shift to prevent diminishing-returns loops (default 3)
- `max-ticks-per-shift` config — limits total ticks per shift (default 10)
- `enabled-skills` config — filter which skills are loaded (default: all)
- Known issues documentation (`.shoe-makers/known-issues.md`) — troubleshooting guide for common elf problems
- Working hours schedule — `.shoe-makers/schedule.md` configures when the shoemakers are active
- Dead code removal skill — dedicated tree node and skill for removing unused code
- `bun run setup` command — evaluates tree and writes focused next-action prompt for the elf

### Changed
- Open plans now support `status: blocked` and `status: done` in frontmatter — blocked/done plans are excluded from work candidates
- Invariants checker now uses per-claim granularity instead of per-page mapping. System now correctly identifies 6 spec gaps and 2 untested claims instead of reporting 0 gaps and sleeping.

### Fixed
- Permission violation detection now filters out auto-commit housekeeping commits — prevents false positives from shift log and archive changes being attributed to elves
- Executor role can now write test files — TDD enforcement handled by adversarial review instead of file-level glob permissions, fixing false violations on bug-fix work items
- Plan detection now checks frontmatter `category: plan` instead of filename matching
- Tick cycle loop: verify clears both currentTask and priorities to prevent infinite work loop
- Removed no-op `scheduled-tasks` from invariants mapping (page has `category: reference`, was filtered out anyway)
- Invariants checker strips comments and its own evidence mapping before scanning to prevent false positive matches
- Missing `continue-work` in `SKILL_TO_ACTION` map — `bun run tick`/`bun run shift` silently dropped partial work actions
- Missing `continue-work` in `runSkill` switch — shift runner returned "Unknown action" for continue-work
- Missing `continue-work` in shift-log-parser — process pattern counting missed continue-work actions
