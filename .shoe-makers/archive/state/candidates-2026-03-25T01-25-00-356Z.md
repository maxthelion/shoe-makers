# Candidates

## 1. Add fallback creative lens when Wikipedia is unreachable
**Type**: implement
**Impact**: high
**Reasoning**: Every innovate action this shift received "Unknown — No article fetched" because Wikipedia is unreachable (network restrictions). The creative exploration pipeline (`wiki/pages/creative-exploration.md`) specifies forced serendipity via random concepts, but `src/creative/wikipedia.ts:fetchRandomArticle()` returns `null` when the network is blocked. A local fallback corpus of 50-100 diverse concepts (biology, architecture, game design, music theory, economics, etc.) would preserve the creative collision mechanism in air-gapped environments. The change would be in `src/creative/wikipedia.ts` — if the API fetch fails, pick a random entry from a local array. This ensures the innovation tier always gets a real creative lens instead of the useless "Unknown" placeholder.

## 2. Add process-loop circuit breaker to break review loops
**Type**: implement
**Impact**: medium
**Reasoning**: The `src/log/shift-log-parser.ts` already detects review loops (`reviewLoopCount`) and `src/log/shift-summary.ts` tracks reactive ratios. But nothing in the tree uses these signals to break cycles. If the system enters a critique → fix-critique loop that can't resolve (e.g., a blocking finding the elf can't fix), it could spend the entire shift stuck. Adding a tree condition that checks `processPatterns.reviewLoopCount > 3` and routes to explore would provide a circuit breaker. This requires changes to `src/tree/default-tree.ts` (new condition) and `src/types.ts` (add processPatterns to WorldState if not already there). The spec in `wiki/pages/behaviour-tree.md` mentions hierarchy of needs but doesn't address loop-breaking — this would need a wiki update too.

## 3. Make typecheck work without npm registry
**Type**: health
**Impact**: medium
**Reasoning**: The `tsconfig.json` specifies `"types": ["bun-types"]` which requires `@types/bun` from npm. In environments where npm is blocked, `runTypecheck()` in `src/skills/assess.ts` returns `null`, meaning the system has no type safety signal. Option: remove `"types": ["bun-types"]` from tsconfig since bun's runtime already provides types natively when running `bun build`. Alternatively, change the typecheck command from `npx tsc --noEmit` to a bun-native check. This would make `typecheckPass` actually meaningful instead of always being `null` in restricted environments.

## 4. Verify README.md accuracy against current capabilities
**Type**: doc-sync
**Impact**: low
**Reasoning**: Standard hygiene — the README should reflect the current feature set including the skill registry, creative exploration, process pattern detection, invariants pipeline, and working hours enforcement. A doc-sync pass ensures new contributors and the morning reviewer understand what the system does.
