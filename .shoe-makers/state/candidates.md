# Candidates

## 1. Add insights count to world state assessment
**Type**: implement
**Impact**: high
**Confidence**: medium
**Risk**: medium
**Reasoning**: Wiki spec `creative-exploration.md` describes insights workflow where prioritise reviews insights (promote/defer/dismiss). Currently `WorldState` in `src/types.ts` has no `insightCount` field, and `src/state/world.ts` doesn't read `.shoe-makers/insights/`. Without this, the tree can't condition on insight presence and prioritise can't systematically review them. Changes needed: types.ts (add field), world.ts (read insights dir), assess.ts (include in assessment). Tests needed for all three.

## 2. Add CLAUDE.md reference to creative-exploration.md wiki page
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: CLAUDE.md's "Key pages" section lists 8 wiki pages but omits `creative-exploration.md` and `verification.md`, both of which are important spec pages. Quick addition.

## 3. Add test that verifies default-tree.ts JSDoc matches actual tree nodes
**Type**: test
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: We just fixed stale JSDoc in default-tree.ts. A test that extracts node names from the tree and verifies the JSDoc mentions them all would prevent future drift. Pattern: read `defaultTree.children`, extract skill names, verify each appears in the file's leading comment.
