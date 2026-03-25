# Candidates

## 1. Reduce review churn by batching low-risk housekeeping commits
**Type**: health
**Impact**: high
**Reasoning**: The shift log shows 64% reactive ratio — dominated by critique/review cycles. Every commit, including evaluate-insight dismissals and explore outputs, triggers a full adversarial review on the next tick. This means ~50% of ticks are spent reviewing mechanical actions (dismissing insights, writing candidates). The `autoCommitHousekeeping` in `src/setup.ts` already skips review for archive/log commits, but state-file-only commits (candidates.md, work-item.md) and insight evaluations still trigger review. A "low-risk action" concept could let the tree skip review for actions that only wrote to `.shoe-makers/` (no src/ or wiki/ changes). See `src/state/world.ts:checkUnreviewedCommits()` and `src/tree/default-tree.ts:hasUnreviewedCommits()`. The commit-filtering logic in `src/verify/detect-violations.ts:filterHousekeepingCommits()` already has the pattern — extend it to cover orchestration-only commits.

## 2. Make typecheck work without npm registry access
**Type**: health
**Impact**: medium
**Reasoning**: The typecheck in `src/skills/assess.ts:runTypecheck()` always returns `null` in environments where `@types/bun` can't be installed (blocked registry, CI without npm). This means type safety is effectively unverifiable. The `tsconfig.json` specifies `"types": ["bun-types"]` which requires the package. Options: (a) remove `"types"` from tsconfig and rely on bun's built-in types, (b) vendor bun-types locally, or (c) change the typecheck command to `bun build --no-bundle src/**/*.ts` which uses bun's native type resolution without needing node_modules. This would make the `typecheckPass` assessment actually useful and catch real type errors. Currently the tree correctly treats `null` as "not failing" but we lose all type safety signal.

## 3. Add shift-level process pattern detection for review loops
**Type**: test
**Impact**: medium
**Reasoning**: The `src/log/shift-log-parser.ts` already detects review loops (critique/fix-critique alternation ≥3x) and reactive ratio. But there's no test coverage for the scenario where the system enters an infinite review loop — e.g., critique writes a blocking finding, fix-critique can't resolve it, critique re-fires. The `getShiftProcessPatterns()` function returns `reviewLoopCount` but nothing in the tree uses it to break loops. Adding a tree condition that detects excessive review loops (e.g., >5 critique cycles without proactive work) and routes to explore instead would prevent the system from spending an entire shift in reactive mode. Relevant files: `src/log/shift-log-parser.ts`, `src/tree/default-tree.ts`, `src/__tests__/shift-log-parser.test.ts`.

## 4. Add fallback creative lens when Wikipedia is unreachable
**Type**: health
**Impact**: low
**Reasoning**: The `src/creative/wikipedia.ts:fetchRandomArticle()` returns `null` when the network is blocked, causing the innovate action to receive "Unknown — No article fetched." The elf must then improvise without a real creative lens, defeating the purpose of forced serendipity. A fallback could use a local corpus of interesting concepts (even a simple hardcoded array of 50-100 diverse topics from different domains — biology, architecture, music theory, game design, etc.) that gets shuffled. This would preserve the creative collision mechanism even in air-gapped environments. See `wiki/pages/creative-exploration.md` for the spec.

## 5. Verify README.md accuracy against current capabilities
**Type**: doc-sync
**Impact**: low
**Reasoning**: The explore prompt asks to check whether `README.md` accurately describes current capabilities. The system now has 221 tested invariants, a full skill registry, creative exploration, process pattern detection, and shift summaries — but the README may not reflect these. A doc-sync pass would ensure the project documentation matches the implemented feature set. This is standard hygiene at the innovation tier.
