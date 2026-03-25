# Candidates

## 1. Add tests for shift orchestrator edge cases
**Type**: test
**Impact**: high
**Reasoning**: `src/scheduler/shift.ts` (123 lines) orchestrates multi-tick execution — the core loop of the system. While it has some tests in `src/__tests__/shift.test.ts`, the exploration found incomplete edge case coverage: error recovery paths, the "sleep" outcome, max-ticks boundary, and state transitions between ticks. This is critical-path code where bugs would cause silent failures overnight. Per wiki `verification.md`, test coverage for critical paths is a hygiene priority. Files: `src/scheduler/shift.ts`, `src/__tests__/shift.test.ts`.

## 2. Add tests for run-skill dispatcher
**Type**: test
**Impact**: high
**Reasoning**: `src/scheduler/run-skill.ts` (48 lines) dispatches tree decisions to skill execution — it's the bridge between the behaviour tree and actual work. It currently has **no dedicated test file**. Only the "explore" action actually executes; all other 10 actions return placeholder prompt strings. Tests should verify: each action type returns a valid prompt, explore calls assess correctly, unknown skill types are handled. Files: `src/scheduler/run-skill.ts`, needs new test `src/__tests__/run-skill.test.ts`.

## 3. Doc-sync: update README to reflect current capabilities
**Type**: doc-sync
**Impact**: medium
**Reasoning**: Per invariant 3.5 ("The README reflects current capabilities as described by the invariants — not aspirational, not stale") and the explore instruction to check README accuracy. The README should describe: the three-phase orchestration cycle, the skill system, adversarial review, working hours, the creative exploration pipeline, and how to communicate via inbox. Current README may not reflect all implemented features like the Wikipedia creative lens, health scoring, or the full behaviour tree. Files: `README.md`, wiki pages for reference.

## 4. Add tests for Wikipedia creative fallback corpus
**Type**: test
**Impact**: medium
**Reasoning**: `src/creative/wikipedia.ts` contains 77 fallback concepts used when Wikipedia is unreachable during innovate actions. The fetch function and fallback selection logic need test coverage to verify: fallback corpus is used when fetch fails, articles have required shape (title + summary), `shouldIncludeLens()` respects insight frequency config. Per wiki `creative-exploration.md`, this pipeline is important for tier-3 innovation. Files: `src/creative/wikipedia.ts`, `src/__tests__/wikipedia.test.ts` (if exists, or new).

## 5. Add health-regression detection tests
**Type**: test
**Impact**: low
**Reasoning**: `src/verify/health-regression.ts` (25 lines) is imported by `setup.ts` but appears to be a minimal stub. The wiki spec (`verification.md`) says "Code health doesn't regress — octoclean scores are checked before and after." Tests should verify the regression check logic works correctly: detects score drops, allows improvements, handles null/missing scores. Files: `src/verify/health-regression.ts`, `src/__tests__/health-regression.test.ts` (if exists).
