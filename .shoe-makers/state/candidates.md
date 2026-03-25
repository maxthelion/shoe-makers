# Candidates

## 1. Add .codehealth/ to init template gitignore entries
**Type**: implement
**Impact**: medium
**Reasoning**: `src/init.ts` scaffolds `.shoe-makers/` for new projects. The init template should add `.codehealth/` to the project's `.gitignore` since octoclean creates this directory during health scans. Without it, new projects will hit the same issue we just fixed — untracked `.codehealth/` directory triggers the uncommitted changes tree node and creates a stuck review loop.

## 2. Doc-sync: functionality.md tree condition list is stale
**Type**: doc-sync
**Impact**: low
**Reasoning**: `wiki/pages/functionality.md:85` lists tree conditions as "tests failing → critiques → stale assessment → inbox → plans → spec gaps → untested code → undocumented code → health → explore" which doesn't match the actual tree at all. The actual conditions are: tests failing → review-loop → critiques → partial work → unreviewed commits → uncommitted changes → inbox → dead-code → work-item → candidates → insights → innovation → explore. This inline summary is misleading.

## 3. Remove duplicate "bun run setup" entry from CHANGELOG
**Type**: doc-sync
**Impact**: low
**Reasoning**: `CHANGELOG.md` still has `bun run setup` mentioned twice (lines 33 and 54 in the original). The dedup in the previous edit removed most duplicates but this one may have survived. Quick verification and cleanup.
