# Candidates

## 1. Fix stale JSDoc in default-tree.ts
**Type**: fix
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: `src/tree/default-tree.ts` (lines 10-20) has a JSDoc comment listing 10 conditions in the behaviour tree, but the actual tree (lines 101-113) has 12 conditions. Missing: `unresolved-critiques` and `unreviewed-commits`. The comment also has incorrect priority order. Quick fix that improves spec-code alignment. Could add a test that verifies the JSDoc stays in sync.

## 2. Split init-skill-templates.ts into individual files
**Type**: health
**Impact**: medium
**Confidence**: medium
**Risk**: medium
**Reasoning**: `src/init-skill-templates.ts` (health 92, worst file) is 378 lines of 9 string constants. Moving each template to a separate `.md` file under `src/skill-templates/` and loading them at runtime (or build time) would reduce the TS file to ~20 lines. This changes the init scaffolding pattern though, so needs careful testing. The existing tests in `init-templates.test.ts` verify template structure and would need updating.

## 3. Parametrize evaluate.test.ts routing tests
**Type**: health
**Impact**: low
**Confidence**: medium
**Risk**: medium
**Reasoning**: `src/__tests__/evaluate.test.ts` (health 94) has 31+ tests following the same pattern: `makeState({...})` → `evaluate()` → `expect(skill).toBe(...)`. Could use a table-driven approach to reduce ~120 lines of repetition. However, the individual test names provide excellent documentation of tree routing rules, and parametrized tests can be harder to debug when they fail. Might not be worth the trade-off.

## 4. Add insights reading to assessment
**Type**: implement
**Impact**: medium
**Confidence**: medium
**Risk**: medium
**Reasoning**: Wiki spec `creative-exploration.md` describes a full insights workflow: explore writes insights to `.shoe-makers/insights/`, prioritise reviews them (promote/defer/dismiss). The prompts instruct this (src/prompts.ts), but the assess skill (`src/skills/assess.ts`) doesn't read insights and the world state doesn't surface them. Implementing this would complete the creative exploration feedback loop. However, this is a larger change touching assess.ts, types.ts, and potentially the blackboard.

## 5. Add doc-sync check: README vs current capabilities
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: Session 1 added Wikipedia creative lens, insight lifecycle, and `insight-frequency` config key. CLAUDE.md project structure section doesn't mention `src/creative/` directory. Minor drift — low impact but easy fix.
