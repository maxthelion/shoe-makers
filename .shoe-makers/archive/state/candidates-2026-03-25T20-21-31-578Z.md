# Candidates

## 1. Reduce verbosity in prompt-builders.test.ts
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/prompt-builders.test.ts` (339 lines, 94/100) is the top worst-scoring file. The tests are well-structured but verbose — many test blocks check single string contains on prompt output. Grouping related assertions and reducing whitespace between tests could help, but the improvements would be marginal since the test logic is already clean. May not significantly change the octoclean score.

## 2. Reduce verbosity in prompts-features.test.ts
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/prompts-features.test.ts` (326 lines, 94/100) has similar patterns. The local helper `expectPromptContains` already reduces duplication for some tests but others still use raw `generatePrompt` + `expect` patterns. The improvements would be marginal and risk making tests less readable.

## 3. Check for outdated dependencies
**Type**: dependency-update
**Impact**: low
**Reasoning**: The project uses `bun@1.3.11` and `typescript@5.9.3`. Checking for available updates could identify security fixes or performance improvements. Low risk since `bun test` validates everything. This is a different kind of improvement from the health-focused work done so far.
