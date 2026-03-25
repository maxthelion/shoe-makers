# Candidates

## 1. Doc-sync: Update role-permission table in verification.md to match current code
**Type**: doc-sync
**Impact**: high
**Reasoning**: The permission table in `wiki/pages/verification.md` lines 19-31 describes roles for work types that no longer exist as separate tree conditions (plan-implementer, implementer, test-writer, doc-writer, refactorer). The code in `src/verify/permissions.ts` lines 26-82 defines different roles: executor, dead-code-remover, prioritiser, innovator, insight-evaluator, explorer. The table also omits these newer roles entirely. Line 143 acknowledges this shift but the table wasn't updated. This is the highest-impact doc-sync issue remaining — the permission table is the primary reference for what elves can and cannot do.

## 2. Add direct unit tests for buildInnovatePrompt and buildEvaluateInsightPrompt
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/prompts/three-phase.ts` exports `buildInnovatePrompt` (line 183) and `buildEvaluateInsightPrompt` (line 222). These are tested indirectly through `generatePrompt()` in `src/__tests__/prompts.test.ts` lines 449-529, but unlike the other 9 prompt builders, they don't have direct unit tests. This is an inconsistency — all other builders (buildExplorePrompt, buildCritiquePrompt, etc.) are tested both directly and via generatePrompt. Low priority since the indirect coverage is adequate.

## 3. Add observability for Wikipedia fetch failures in explore actions
**Type**: bug-fix
**Impact**: low
**Reasoning**: In `src/setup.ts` lines 90-99, Wikipedia fetch failures are logged for innovate actions ("Wikipedia article fetch failed") but silently ignored for explore actions with creative lens (line 97-99). A null return from `fetchRandomArticle()` during explore falls through with no shift log entry. Adding a log entry would improve debuggability in environments where the network is restricted.
