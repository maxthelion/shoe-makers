# Split wikipedia.test.ts and world.test.ts

skill-type: octoclean-fix

## What to do

### 1. Split `src/__tests__/wikipedia.test.ts` (322 lines) into two files

- `src/__tests__/wikipedia-api.test.ts` — API/fetch tests (lines 1-215): shouldIncludeLens, FALLBACK_CONCEPTS, getRandomFallbackConcept, fetchRandomArticle, fetchArticleForAction
- `src/__tests__/wikipedia-corpus.test.ts` — Corpus filesystem tests (lines 217-322): loadCorpus, pickUnusedArticle, markArticleUsed, fetchArticleFromCorpus

### 2. Split `src/__tests__/world.test.ts` (319 lines) into two files

- `src/__tests__/world-state.test.ts` — readWorldState, getCurrentBranch, hasUncommittedChanges (lines 1-72 + 312-318)
- `src/__tests__/world-checks.test.ts` — checkUnreviewedCommits, readWorkItemSkillType, file existence checks, countInsights, countUnresolvedCritiques (lines 74-310)

## Decision Rationale

Continues the successful test-file splitting pattern. These are the last two 95-score files.
