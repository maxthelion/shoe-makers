# Candidates

## 1. Prompt composition system — reduce drift in prompts.ts
**Type**: health
**Impact**: high
**Reasoning**: `src/prompts.ts` (health 93) has 15+ builder functions with duplicated patterns. The `OFF_LIMITS` constant is shared but tier guidance, wiki-is-truth reminders, and output format instructions are copy-pasted with slight drift between prompts (e.g. `buildExplorePrompt` and `buildPrioritisePrompt` have subtly different tier guidance wording for the same concept). Extracting shared prompt sections (off-limits, tier guidance, skill sections, output format) into composable pieces would reduce the file from ~360 lines of bespoke string templates to ~250 lines of composition + reusable parts. This directly addresses the worst health score in the codebase and makes prompt changes less error-prone. Skill type: `octoclean-fix`.

## 2. README sync with current implementation
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `README.md` describes the system generically but doesn't reflect the current operational state. The setup protocol, file paths (`.shoe-makers/state/next-action.md`), and the explore/prioritise/execute cycle are documented in wiki pages (`wiki/pages/bootstrapping.md`, `wiki/pages/architecture.md`) but the README hasn't been updated to match. When new projects install shoe-makers, the README is the first thing they read. At health 99, the system deserves accurate first-impression docs. Skill type: `doc-sync`.

## 3. Archive resolved findings automatically during explore phase
**Type**: improve
**Impact**: medium
**Reasoning**: There are currently 4 resolved findings sitting in `.shoe-makers/findings/` (critiques 095–098, all marked `Resolved`). The tree detects these as "open findings" (setup reports `Findings: 4`) which inflates the findings count and could trigger unnecessary fix-critique actions if the tree logic changes. Previous elves have manually archived resolved critiques (commit `9ea028d`). This could be a step in the explore or review phase: move any finding with `## Status\n\nResolved.` to `findings/archive/`. Simple, no risk, reduces noise in the findings directory. This is a workflow improvement for the system itself. Skill type: `implement`.
