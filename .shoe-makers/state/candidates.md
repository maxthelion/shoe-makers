# Candidates

## 1. Fix README behaviour tree diagram to match actual implementation
**Type**: doc-sync
**Impact**: high
**Reasoning**: The README (lines 11-20) shows a 7-item behaviour tree but the actual tree in `src/tree/default-tree.ts:76-92` has 10 items. Missing from README: `[uncommitted changes?] → Review` (between unreviewed-commits and inbox) and `[dead-code work-item?] → Remove dead code` (between inbox and work-item). The ordering of remaining items is also wrong — inbox is shown before review in the README but after it in code. The `[neither?]` label should be `[always true]`. Since the README is the first thing new users see, an inaccurate tree diagram misrepresents the system's behaviour. Skill type: `doc-sync`.

## 2. Extract shared work-item preamble in prompts.ts
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `buildExecutePrompt()` and `buildDeadCodePrompt()` both start with "Read `.shoe-makers/state/work-item.md`" and end with "Delete `.shoe-makers/state/work-item.md`". A shared `WORK_ITEM_PREAMBLE` or similar could reduce duplication. However, the surrounding steps differ enough that extraction might reduce readability. Low priority — only worth doing if it improves the health score. Skill type: `octoclean-fix`.

## 3. Add claim-evidence entries for the new archiveResolvedFindings feature
**Type**: test
**Impact**: medium
**Reasoning**: The auto-archive feature (commit b6ec1d8) is a new behaviour not tracked in `.shoe-makers/claim-evidence.yaml`. The invariants checker may flag it as "unspecified" if/when invariants are updated. Proactively adding evidence entries linking the archive tests to relevant spec claims would keep the evidence pipeline clean. Skill type: `test`.
