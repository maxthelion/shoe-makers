# Candidates

## 1. Add claim-evidence entries for the new prompts/ module structure
**Type**: test
**Impact**: medium
**Reasoning**: The refactor from `src/prompts.ts` to `src/prompts/` created 1 unspecified invariant (`code.prompts`). The claim-evidence file (`.shoe-makers/claim-evidence.yaml`) needs entries mapping the new module files (`src/prompts/helpers.ts`, `src/prompts/reactive.ts`, `src/prompts/three-phase.ts`, `src/prompts/index.ts`) to existing spec claims. This keeps the invariants pipeline clean and prevents future elves from flagging it as a gap. Reference: the existing pattern in claim-evidence.yaml where `src/prompts` source entries need updating to `src/prompts/index` or `src/prompts/helpers`.

## 2. Sync README project structure section with actual codebase layout
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README's "Project structure" section (line 117-133) shows `src/` as a flat comment ("The behaviour tree system") but doesn't reflect the actual module organisation (`src/prompts/`, `src/tree/`, `src/skills/`, `src/state/`, `src/log/`, `src/config/`, `src/creative/`, `src/verify/`, `src/scheduler/`, `src/utils/`). Also, `CLAUDE.md` still shows the old flat structure without the prompts directory. Updating both to reflect the actual layout would help new contributors and future elves understand the codebase.

## 3. Add a typecheckPass field to shift log dashboard entries
**Type**: implement
**Impact**: medium
**Reasoning**: The `assess` function in `src/skills/assess.ts` tracks both `testsPass` and `typecheckPass`, but the shift log dashboard (`src/log/shift-log.ts:formatDashboard`) only shows action counts and categories — it doesn't surface whether types or tests are passing. Adding a compact status line (e.g. "Tests: pass | Types: pass | Health: 100") to the dashboard would give humans an instant health check in the morning review without reading the full log. This serves the wiki's observability principle: "the shift log tells a narrative, not just facts."
