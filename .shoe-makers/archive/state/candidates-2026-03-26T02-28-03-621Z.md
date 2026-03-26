# Candidates

## 1. [Add creative corpus claim-evidence patterns — close 7 specified-only gaps]
**Type**: implement
**Impact**: high
**Reasoning**: 7 of the 19 remaining specified-only invariant gaps are creative corpus claims (sections 2.6.1 and 2.6.2). The implementation exists in `src/creative/wikipedia.ts` (readLocalCorpus, pickFromCorpus, markArticleUsed) with tests in `src/__tests__/creative-corpus.test.ts`. But there are NO claim-evidence YAML entries for these claims — no evidence patterns defined at all. Creating a new claim-evidence file with patterns matching the existing code would close all 7 gaps at once.

## 2. [Fix innovate observability evidence pattern — update "Start with the article title" to new template format]
**Type**: doc-sync
**Impact**: medium
**Reasoning**: `.shoe-makers/claim-evidence/23-innovate-observability.yaml` line 27 contains the pattern `"Start with the article title"` which was the old prose format. The structured innovate prompt now uses `**Article Title** — [YOUR CONTENT HERE...]` instead. This broken evidence pattern causes the invariant `the-innovate-prompt-output-the-insight-file-must-include-the` to fail. Updating the pattern to match the new template format would close this gap.

## 3. [Add structured skills claim-evidence patterns — close remaining skills gaps]
**Type**: implement
**Impact**: high
**Reasoning**: 11 of 19 remaining gaps are structured-skills claims about template pre-filling, mechanical/intelligent separation, validation sections, etc. The code implementing these patterns exists across `src/prompts/` (explore, prioritise, innovate, evaluate-insight, critique all now use structured templates). Evidence patterns need to match the actual template code — patterns like `[YOUR CONTENT HERE` or `pre-filled` would match.
