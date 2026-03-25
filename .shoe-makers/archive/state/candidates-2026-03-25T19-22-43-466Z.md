# Candidates

## 1. Doc-sync: behaviour-tree.md tree diagram has extra annotations
**Type**: doc-sync
**Impact**: low
**Reasoning**: `wiki/pages/behaviour-tree.md:21-33` tree diagram includes `(direct prompt)` annotations that `tick-types.md` and `default-tree.ts` don't use. This is a minor style inconsistency — not wrong, but the two wiki tree diagrams should match. Low priority since the information is correct.

## 2. Update CHANGELOG.md to reflect recent changes
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `CHANGELOG.md` was last updated during the bootstrapping phase and references the `agent-work-execution.md` plan page we just deleted. It doesn't mention recent improvements: setup.ts refactoring, dead code removal, tick-types.md doc-sync, .codehealth/ gitignore fix. A CHANGELOG update would help the human reviewer understand what this shift accomplished.

## 3. Add .codehealth/ to init template gitignore entries
**Type**: implement
**Impact**: low
**Reasoning**: The `src/init.ts` scaffolds `.shoe-makers/` for new projects. The gitignore additions in the init template should include `.codehealth/` since octoclean creates this directory during health scans. Without it, new projects will hit the same "untracked .codehealth/ triggers uncommitted changes" issue we fixed. Files: `src/init.ts` or init templates.
