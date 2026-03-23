# Candidates

## 1. Wire Wikipedia creative exploration into explore prompt
**Type**: implement
**Impact**: high
**Confidence**: high
**Risk**: low
**Reasoning**: `src/creative/wikipedia.ts` has `fetchRandomArticle()` and `shouldIncludeLens()` fully implemented but never called. The explore prompt in `src/prompts.ts` doesn't reference it. Wiring requires ~20 lines: call `shouldIncludeLens()`, if true fetch an article, append the lens section to the explore prompt. This activates the core creative exploration feature specified in `wiki/pages/creative-exploration.md` and resolves 4-5 specified-only invariants (creative-exploration.*). The insights directory `.shoe-makers/insights/` already exists.

## 2. Add tests for `src/creative/wikipedia.ts`
**Type**: test
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: 44-line module with two exported functions and zero tests. `shouldIncludeLens()` is trivially testable. `fetchRandomArticle()` can be tested with mocked fetch (success, failure, stub article < 50 chars). Resolves 2 implemented-untested invariants: `creative-exploration.some-explore-cycles-include-a-random-wikipedia-article` and `creative-exploration.frequency-is-configurable-via-insightfrequency`. Per `.shoe-makers/invariants.md` section 2.5.

## 3. Add tests for `src/config/load-config.ts`
**Type**: test
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: 92-line config loader with no dedicated test file. It parses `.shoe-makers/config.yaml`, applies defaults, validates values. Config drives tick interval, branch prefix, assessment staleness — all foundational. Tests should cover: missing file (defaults), valid YAML, invalid values, unknown keys. The existing `src/__tests__/config.test.ts` exists but check if it covers `load-config.ts` specifically. Improves confidence in world state correctness.

## 4. Wire dead skill modules into production code path
**Type**: implement
**Impact**: medium
**Confidence**: medium
**Risk**: medium
**Reasoning**: `src/skills/prioritise.ts`, `src/skills/verify.ts`, `src/skills/work.ts` have implementations and tests (203, 161, 139 lines respectively) but are never called from production code. They're imported only from test files. `src/scheduler/run-skill.ts` should dispatch to these when the behaviour tree selects prioritise/execute/verify actions. This was flagged in `spec-code-audit-2026-03-22.md` as "Still Open". Risk: wiring may require interface changes since these skills expect blackboard state that may not be set up by the current flow.

## 5. Implement README accuracy check in explore step
**Type**: implement
**Impact**: low
**Confidence**: medium
**Risk**: low
**Reasoning**: Invariant `spec.project-documentation.the-explore-step-checks-whether-the-readme-is-accurate` is specified-only. The explore prompt should instruct the elf to compare README claims against actual code and flag drift as a finding. This is a prompt-level change in `src/prompts.ts` — add a section to the explore action that asks the elf to verify README accuracy. Low risk since it's advisory, not enforced.
