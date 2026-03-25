# Candidates

## 1. Add tests for prompt builders
**Type**: test
**Impact**: high
**Reasoning**: The 8 prompt builder files in `src/prompts/` (explore.ts, execute.ts, prioritise.ts, reactive.ts, innovate.ts, evaluate-insight.ts, helpers.ts, three-phase.ts) are entirely untested. These files generate the prompts that directly guide elf behaviour — they are the most behaviour-critical untested code in the system. The existing `prompts.test.ts` (health score 87) only tests the dispatcher, not the individual builders. Each builder should have tests validating key structural elements: required sections, skill references, state-dependent content. Wiki page `skills.md` and `structured-skills.md` specify that skills have validation patterns — prompt builders should be tested to the same standard.

Files: `src/prompts/explore.ts`, `src/prompts/execute.ts`, `src/prompts/prioritise.ts`, `src/prompts/reactive.ts`, `src/prompts/innovate.ts`, `src/prompts/evaluate-insight.ts`, `src/prompts/helpers.ts`
Test file: `src/__tests__/prompts.test.ts`

## 2. Refactor setup.ts to reduce complexity
**Type**: health
**Impact**: medium
**Reasoning**: `src/setup.ts` is the largest file in the codebase (430 lines, health score 90) and does 13 distinct operations in a single `main()` function: branch management, assessment, tree evaluation, permission detection, finding archival, housekeeping auto-commits, shift logging, and more. The `autoCommitHousekeeping` and `isAllHousekeeping` logic is buried and untested. Breaking this into smaller, testable functions would improve both health score and testability. Wiki page `architecture.md` specifies separation of concerns — setup.ts currently violates this by mixing orchestration with side effects.

Files: `src/setup.ts`
Worst-score file per octoclean assessment.

## 3. Add tests for config/load-config.ts
**Type**: test
**Impact**: medium
**Reasoning**: `src/config/load-config.ts` (110 lines) handles YAML parsing with validation logic and fallback defaults but has zero tests. It includes `parseInsightFrequency`, `intOrDefault`, and type coercion logic that silently falls back to defaults on invalid input. Configuration errors could cause subtle misbehaviour (wrong tick interval, wrong branch prefix, disabled skills) that would be hard to diagnose. Wiki page `integration.md` specifies config keys and their expected types — tests should validate these contracts.

Files: `src/config/load-config.ts`
No existing test file.

## 4. Add tests for init skill templates
**Type**: test
**Impact**: low
**Reasoning**: The 3 init-skill-template files (`init-skill-templates-work.ts`, `init-skill-templates-quality.ts`, `init-skill-templates-docs.ts`, ~350 lines total) export raw markdown strings that define the skill prompts new projects receive. These are untested — a malformed template would break skill loading via the registry's frontmatter parser. Tests should validate that each template parses as valid frontmatter with required fields (name, description, maps-to, risk). Wiki page `skills.md` specifies the required frontmatter schema.

Files: `src/init-skill-templates-work.ts`, `src/init-skill-templates-quality.ts`, `src/init-skill-templates-docs.ts`
No existing test file.

## 5. Improve world.test.ts coverage
**Type**: test
**Impact**: low
**Reasoning**: `src/__tests__/world.test.ts` (health score 91) only covers basic git status queries but misses several functions in `src/state/world.ts`: `readWorkItemSkillType`, `countUnresolvedCritiques`, `readFindings`, and edge cases in `gitDiffFiles`. These functions feed the behaviour tree's condition checks — if they return wrong values, the tree routes incorrectly. Adding tests for untested world state readers would improve both coverage and the health score.

Files: `src/state/world.ts`, `src/__tests__/world.test.ts`
