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
- Adversarial verification has reviewed each piece of work looking for problems
- Verification checks intent alignment: does this change actually serve the project's goals?
- Code health doesn't regress — octoclean scores are checked before and after
- If verification fails, changes are reverted before the human ever sees them
- Critiques from verification become findings that future elves action — quality improves over time
- Agents can run fuzz tests, screenshot comparisons, and other thorough checks because they have time

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

### 2.1 The reactive tree
- The behaviour tree is evaluated every tick — re-evaluates from scratch, cannot get stuck
- It's reactive, not planned: look at the world, do the most important thing, repeat
- The first matching condition determines the action — priority is the tree order
- When the condition is resolved (tests pass, plan implemented), the tree falls through to the next match
- The system almost never sleeps — an "explore" action at the bottom surfaces new work
- If an agent crashes, the next tick sees the same world and retries

### 2.2 The tree conditions (in priority order)
- Tests failing? → Fix them (always highest priority)
- Unverified work on branch? → Review the diff adversarially
- Inbox messages? → Read and act on them
- Open plans? → Implement the most important one
- Specified-only invariants? → Implement the most impactful one
- Untested code? → Write tests for the riskiest one
- Undocumented code? → Update the wiki
- Code health below threshold? → Fix the worst file
- Nothing? → Explore deeper to surface new work

### 2.3 Narrow-scoped actions
- Each tick, the tree produces a focused prompt scoped to one action
- A verify action gives reviewer instructions — the elf only reviews a diff
- A work action gives implementation instructions with the relevant skill prompt
- The elf doesn't need to understand the whole system — just read the prompt and do the work

### 2.4 Assessment and exploration
- Tree conditions read a cached assessment (.shoe-makers/state/assessment.json)
- Assessment contains: invariant gaps, test results, health scores, open plans, findings, git activity
- The "explore" action refreshes the cache when stale or when nothing else matches
- Assessment must be granular: a wiki page with 10 behaviours → 10 invariants, not 1
- Findings from previous elves are part of the assessment — context survives across sessions

### 2.5 Priority
- Macro priority (tree order) is deterministic — built into the tree structure
- Micro priority (which specific item) uses the elf's judgement — the LLM thinks, no API needed
- No separate prioritisation phase — tree handles routing, elf handles selection within each action

### 2.5 The wiki drives work
- The wiki is the source of truth — agents read it to understand project intent
- Plans generate work candidates until implemented or marked done/blocked
- Invariants surface three types of gap: specified-only, implemented-untested, unspecified
- Agents also discover improvements from code analysis that isn't in the wiki at all
- When agents build something, they update the spec — closing the loop

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

### 3.3 Verification
- "Unverified work on branch?" is a tree condition — when it matches, the elf gets a review prompt
- The reviewer examines the diff adversarially: problems, bugs, spec misalignment, architectural violations
- All tests must pass — no exceptions
- Code health must not regress (octoclean diff)
- If verification fails, changes are reverted — bad work never stays on the branch
- Critiques become findings for future elves
- Multi-round review emerges from the tree: verify rejects → tree re-evaluates → condition still matches → work retries
- Linting and type checking pass

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
