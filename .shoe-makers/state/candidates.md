# Candidates

## 1. Add timeout to Wikipedia fetch requests
**Type**: bug-fix
**Impact**: high
**Reasoning**: `src/creative/wikipedia.ts` makes two sequential HTTP requests to the Wikipedia API (`fetchRandomArticle()`) without any timeout constraint. If Wikipedia is slow or unresponsive, the function hangs indefinitely, blocking the setup script and the entire elf cycle. During scheduled overnight runs, this could waste the entire shift. Fix: add `AbortSignal.timeout(10000)` (10 seconds) to both fetch calls. The function already has a fallback (`getRandomFallbackConcept()`) for network failures, so a timeout-triggered abort would correctly fall through to the fallback. The tests in `wikipedia.test.ts` mock fetch and don't test timeout scenarios — add a test for timeout behavior.

## 2. Fix incomplete skill list assertion in init.test.ts
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `src/__tests__/init.test.ts:62-71` tests "scaffolds all core skills" but only checks for 5 of the 13 skill files that `src/init.ts:52-66` actually scaffolds. Missing: `octoclean-fix.md`, `bug-fix.md`, `dead-code.md`, `dependency-update.md`. If new skills are added to init.ts, the test won't catch them. The test name is misleading — it claims to check "all core skills" but doesn't. Fix: expand the assertion to check all 13 scaffolded files, or make the list data-driven.

## 3. Stale invariants finding needs human attention (informational)
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Finding `invariant-update-2026-03-25.md` documents two specified-only invariants referencing the removed verify model. Only humans can update `.shoe-makers/invariants.md`. No elf action possible.
