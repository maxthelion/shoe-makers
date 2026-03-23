# Candidates

## 1. Update CLAUDE.md project structure to include creative/ directory
**Type**: doc-sync
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: CLAUDE.md's project structure section (the main developer reference) doesn't mention `src/creative/` directory which was added in session 1 for Wikipedia integration. Also doesn't mention `src/config/` directory. The structure should accurately reflect what exists. Quick fix — just update the tree in CLAUDE.md.

## 2. Add insights reading to world state assessment
**Type**: implement
**Impact**: high
**Confidence**: medium
**Risk**: medium
**Reasoning**: Wiki spec `creative-exploration.md` describes insights workflow: explore writes to `.shoe-makers/insights/`, prioritise reviews (promote/defer/dismiss). Prompts instruct this but `src/skills/assess.ts` doesn't read insights and `WorldState` in `src/types.ts` doesn't surface insight count. Without this, the tree can't condition on whether insights exist. Would need changes to types.ts, assess.ts, and world.ts.

## 3. Add shift summary for session 2
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: Session 1 wrote `.shoe-makers/findings/shift-2026-03-23-session1.md` with a summary of work done. Session 2 should do the same before ending. Captures: adversarial review of session 1, evidence pattern tightening, +40 tests from skill template coverage, JSDoc fix in default-tree.ts. Useful for continuity between sessions.
