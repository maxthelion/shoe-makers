# Candidates

## 1. Archive done plan: agent-work-execution.md
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/agent-work-execution.md` has `status: done` and all success criteria checked. Per `wiki/pages/plans-vs-spec.md:48`, done plans "should be archived to spec or deleted. Excluded from open plans." The plan's content (task lifecycle commands, three-phase work execution) is already reflected in the spec pages (`tick-types.md`, `scheduled-tasks.md`, `behaviour-tree.md`). This page should be archived or deleted to maintain wiki hygiene. Stale done-plans clutter the spec and could confuse future explore cycles.

## 2. Doc-sync: tick-types.md missing partial-work node
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/tick-types.md:17` shows the tree diagram but is missing the `[partial work?] → Continue work` node that exists in `src/tree/default-tree.ts`. The actual tree has `partial-work` between `unresolved-critiques` and `unreviewed-commits`, but the wiki diagram doesn't show it. Also missing: `[unverified-work?] → review` node. The wiki tree diagram should match the actual tree implementation.

## 3. Improve test health: consolidate prompt test helpers
**Type**: health
**Impact**: low
**Reasoning**: The three worst files are all prompt test files (`prompt-builders.test.ts`, `prompt-helpers.test.ts`, `prompts-features.test.ts`) at 94/100. Recent shifts have successfully consolidated test files (e.g., `octoclean-fix: consolidate innovate and evaluate-insight tests`). These could benefit from extracting shared prompt test setup into `test-utils.ts`. Note: the health skill permits modifying test files unlike octoclean-fix.
