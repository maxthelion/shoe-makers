# Candidates

## 1. Deduplicate RESOLVED_PATTERN into a shared constant
**Type**: health
**Impact**: medium
**Reasoning**: `RESOLVED_PATTERN` is now defined independently in two files: `src/state/world.ts:94` (exported) and `src/skills/assess.ts:77` (private). The auto-archive feature added a duplicate. The previous adversarial review (critique-101) flagged this as tech debt. Fix: import the existing exported `RESOLVED_PATTERN` from `src/state/world.ts` in `assess.ts` instead of redefining it. One-line fix, eliminates drift risk. Skill type: `octoclean-fix`.

## 2. README sync — add `bun run init` prerequisite note and verify accuracy
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The README references `bun run init` (line 59) which scaffolds the `.shoe-makers/` directory. Need to verify this script exists and works. Also, the README's behaviour tree diagram (lines 11-20) should be checked against the actual tree in `src/tree/default-tree.ts` — it's missing the `dead-code` and `review` (uncommitted work) conditions that are in the actual tree. The tree has evolved but the README diagram hasn't. Skill type: `doc-sync`.

## 3. Improve prompts.ts health score by extracting shared prompt sections
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/prompts.ts` has health score 93 (worst in codebase). The `OFF_LIMITS` constant is shared but other repeated patterns aren't: the "After completing" / "Run `bun run setup`" footer, the work-item read/execute/delete/commit pattern (shared between `buildExecutePrompt` and `buildDeadCodePrompt`), and the tier determination logic. Extracting 2-3 more shared sections could improve the health score. Care needed to not over-abstract — only extract genuinely repeated sections. Skill type: `octoclean-fix`.
