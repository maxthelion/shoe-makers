# Shoe-Makers Invariants

Top-down. Start with what the user experiences, cascade into how it works, then architectural guarantees. Each claim is falsifiable.

---

## 1. What a user can do

### 1.1 Set up and go
- A user can install shoe-makers in any repo and have it start improving the project with minimal configuration
- An init command scaffolds `.shoe-makers/` with protocol, config, skills, and directory structure
- Existing docs and code are bootstrapped into the wiki via batch import (not a blank slate)
- A one-line scheduled task prompt is all that's needed: "Read .shoe-makers/protocol.md and follow it"
- It works without editing config.yaml — sensible defaults for everything
- `.shoe-makers/schedule.md` configures working hours — the setup script exits immediately outside these hours
- If no schedule file exists, the shoemakers work any time

### 1.2 Wake up to a better project
- Overnight, the system produces a branch with genuine improvements across multiple categories
- The improvements are not just one type — features, tests, docs, code health, and bug fixes are balanced
- The branch tells a coherent story: a human reads the shift log and understands what happened, what was tried, what failed, and what's left
- Agents work unbidden — they infer what to do from the spec and code, not from explicit task lists
- Agents can produce unexpected, delightful results — not just grinding through a backlog
- Quality over speed: agents take their time, run thorough checks, because no impatient human is watching

### 1.3 Review and merge with confidence
- Nothing reaches main without the human choosing to merge
- The human can merge the whole branch, cherry-pick specific commits, or discard entirely
- If discarded, nothing is lost — next shift starts fresh from main
- Each commit has a clear message explaining what was built and why
- The shift log provides enough context to make good merge decisions without reading every diff
- Verification has already caught and reverted bad work — what's on the branch passed checks

### 1.4 Steer the elves
- Drop a markdown file in `.shoe-makers/inbox/` and the next elf acts on it with priority over other work
- Write a plan page in the wiki (`category: plan`) and elves work toward implementing it
- Mark areas as off-limits in skill definitions and elves respect that
- Adjust the behaviour tree to shift focus: more testing, less features, or vice versa
- Mark a plan as `status: blocked` or `status: done` to control what generates work
- Findings and suggestions from previous elves are visible to the human and inform future priorities

### 1.5 Trust the quality
- Every change on the branch has passing tests — no exceptions
- A different elf adversarially reviews each piece of work — not self-review
- The reviewer knows what rules the previous elf was given and checks compliance
- Verification checks: scope violation, test quality, invariant gaming, spec alignment, regressions
- Code health doesn't regress — octoclean scores are checked before and after
- If verification finds blocking issues, they must be fixed before new work starts
- Critiques become findings that future elves action — quality improves over time
- Elves cannot modify invariants — only humans maintain `.shoe-makers/invariants.md`

### 1.6 TDD enforcement
- Implementing a feature starts with writing tests, not code
- The elf writing tests cannot write implementation in the same tick
- The elf making tests pass cannot modify the tests
- This is enforced by the permission model: each tick's role determines what files are writable

### 1.6 Maintain a living spec
- The wiki describes what the system is and does — it is the source of truth, not the code
- If the spec is accurate enough, the application could be rebuilt from scratch
- Plans describe what the system should become — deltas that are closed by implementation
- When a plan is implemented, spec pages are updated and the plan is archived
- Agents create new spec pages when they discover undocumented behaviour
- Agents update stale spec pages when code has diverged from docs
- Invariants continuously compare spec against code and surface gaps as work

---

## 2. How it decides what to do

### 2.1 One invocation, one action, one exit
- Each scheduled invocation does ONE thing and exits — the elf never loops internally
- The behaviour tree evaluates from scratch each invocation — cannot get stuck
- The scheduled task interval provides the loop, not the elf
- If an agent crashes, the next invocation sees the same world and retries

### 2.2 Reactive conditions (top of tree, fixed priority)
- Tests failing? → Fix them (always highest priority, direct prompt)
- Unresolved critiques? → Fix the flagged issues (direct prompt)
- Unreviewed commits? → Review adversarially (direct prompt)
- Inbox messages? → Read and act on them (direct prompt)
- These fire immediately with a focused prompt — no orchestration needed

### 2.3 Three-phase orchestration (bottom of tree)
- If no reactive condition matches, proactive work goes through three phases across three invocations
- **Explore**: read everything (wiki, code, invariants, health, findings), write `candidates.md` with a ranked list of possible work items
- **Prioritise**: read candidates + relevant code and wiki for the top items, pick one, write a detailed `work-item.md` with full context (relevant wiki text, relevant code, exactly what to build, which patterns to follow)
- **Execute**: read `work-item.md`, do the work, commit, optionally write a follow-up `work-item.md` for the next elf (e.g. "review what I just built")
- Each phase narrows the context for the next — explore is broad, prioritise is medium, execute is narrow

### 2.4 The prioritiser writes the real prompt
- The prioritise step IS the orchestrator — its entire job is to write a really good, specific prompt
- Not "implement something from the wiki" but "the wiki says X, the code has Y, build Z in this file following this pattern"
- It reads the relevant code to understand conventions, reads the wiki to understand intent, and writes instructions the executor can follow without searching
- This is the LLM judgement step — it weighs impact, confidence, risk, and balance across work types
- No hardcoded priority between features/tests/docs/health — the prioritiser decides each cycle

### 2.5 The wiki drives work
- The wiki is the source of truth — agents read it to understand project intent
- Invariants compare wiki claims against code and surface gaps
- Plans generate work candidates until implemented or marked done/blocked
- When agents build something, they update the spec — closing the loop
- Changes to the wiki surface as new invariant gaps — elves discover changed intent automatically

---

## 3. How it does the work

### 3.1 Pure function agents
- An agent receives a scoped job description and produces file changes — that's it
- Agents don't push, create PRs, or call external services — the scheduler handles side effects
- If an agent crashes, nothing is inconsistent — there's nothing to clean up
- The scheduled task IS the agent — "LLM prioritiser" means the elf thinks, not that code calls an API
- Agents are replaceable: different LLM, different prompt, a human — same interface
- Partial work is fine: agent writes what it has, exits, next tick picks up from there

### 3.2 Skills
- Defined as markdown files in `.shoe-makers/skills/` — prompts, not code
- Each skill has: description, when-to-apply, instructions, verification criteria, risk level, permitted actions, off-limits
- Registry matches priority type to skill definition
- Current skills: fix-tests, implement, test-coverage, doc-sync, health
- Planned: octoclean-fix (octoclean-specific), bug-fix (from issues), dependency-update, dead-code removal
- Humans and elves can both add new skills — they're just files

### 3.3 Role-based permissions
- Each action has a role that determines which files the elf can write
- Reviewers can only write findings — they cannot modify code
- Implementers must write tests first (TDD) — they cannot touch tests and implementation in the same tick
- Invariants are never writable by elves — only humans maintain the spec claims
- The permissions are stated in the action prompt and verified by the reviewer

### 3.4 Cross-elf gatekeeping
- `last-reviewed-commit` tracks which commits have been reviewed
- "Unreviewed commits?" checks if HEAD is ahead of the last review marker
- The reviewer gets: the diff, the rules the previous elf was given (`last-action.md`), and adversarial instructions
- Critiques are written as findings with severity (blocking or advisory)
- "Unresolved critiques?" sits near the top of the tree — blocking critiques prevent new work
- Multi-round review emerges from the tree: critique → fix → review the fix

### 3.4 Observability
- Every tick appends to `.shoe-makers/log/YYYY-MM-DD.md`: timestamp, decision, outcome
- The shift log tells a narrative, not just facts — "tried X because Y, found Z, decided W"
- Findings persist in `.shoe-makers/findings/` until resolved — context survives across elves
- Suggestions for next priorities are noted in the shift log
- Automated logging from `bun run tick` supplements manual elf entries
- The morning review should be self-contained: shift log + findings + commits = full picture

### 3.5 Self-improvement
- Agents can modify the protocol, add scripts, create skills, update the wiki
- Every elf should leave the workshop in better shape than they found it
- Friction → scripts. Confusion → wiki updates. Missing capability → new skills
- The protocol evolves from prose (bootstrap) to automated invocation (self-hosting)
- The system builds the system that replaces the bootstrap

---

## 4. Architectural guarantees

### 4.1 Statelessness and resilience
- The branch is the only state — no database, no server, no persistent process
- Blackboard files (`.shoe-makers/state/`) are ephemeral caches, not a database
- Deleting the branch resets everything cleanly
- The system can be interrupted at any point and resume correctly next tick
- No task tracking, no locks, no leases — the classes of bugs that killed Octopoid cannot occur
- The behaviour tree re-evaluates from scratch — no state machine to get stuck in

### 4.2 Separation of concerns
- Routing (behaviour tree conditions) is deterministic — no LLM needed
- Intelligence (review, implementation, selection within a condition) lives in the agents
- Side effects (commit, push, merge) live in the tick loop, never in agents
- The wiki is the interface between human intent and agent action
- The assessment cache is the interface between explore and tree conditions

### 4.3 Branch isolation
- One branch per shift, created from main
- Agents commit freely within the branch — no approval needed
- Only one branch is active at a time — no cross-branch conflicts
- The human merges before the next shift starts
- The branch lifecycle is: create → work → review → merge/discard

---

## 5. Data contracts

### 5.1 Assessment cache
- assessment.json: written by the explore action, read by tree conditions
- Contains: invariant gaps (specified-only, untested, unspecified — with details), test results, health scores, open plans, findings, recent git activity
- This is the only state file — the tree reads it, explore writes it

### 5.2 Configuration
- `.shoe-makers/config.yaml` with sensible defaults
- Configurable: branch prefix, tick interval, assessment staleness, max ticks per shift, wiki directory, enabled skills
- Works without a config file

### 5.3 Skill files
- Frontmatter: description, maps-to (priority type), risk level
- Body: when to apply, instructions, verification criteria, permitted actions, off-limits
- Registry loads all `.md` files from `.shoe-makers/skills/` and matches by maps-to field
