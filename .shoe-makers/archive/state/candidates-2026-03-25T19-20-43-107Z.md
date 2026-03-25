# Candidates

## 1. Archive done plan: agent-work-execution.md
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/agent-work-execution.md` has `category: plan` and `status: done` with all success criteria checked. Per `wiki/pages/plans-vs-spec.md:47-48`, done plans "should be archived to spec or deleted. Excluded from open plans." The content (task lifecycle commands, three-phase execution) is fully reflected in existing spec pages. This stale plan should be deleted or moved to an archive location to maintain wiki hygiene.

## 2. Doc-sync: behaviour-tree.md missing partial-work and unverified-work nodes
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `wiki/pages/behaviour-tree.md` likely has a tree diagram similar to `tick-types.md` that may also be missing the `partial-work` node. The tick-types.md was just fixed but the behaviour-tree.md page may have the same issue. Should verify and fix if needed.

## 3. Add .codehealth/ to init template gitignore
**Type**: implement
**Impact**: low
**Reasoning**: We just added `.codehealth/` to `.gitignore` because octoclean scan creates this directory. The init template that scaffolds `.shoe-makers/` for new projects should include `.codehealth/` in its gitignore additions so other projects don't hit the same issue. File: `src/init.ts` or wherever init templates are defined.
