# Candidates

## 1. Improve prompts.test.ts health score (87 → 93+)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/__tests__/prompts.test.ts` is the worst-scoring file at 87. Major duplication: the innovate prompt block (lines 456-523) calls `generatePrompt("innovate", ...)` with identical args 10 times; evaluate-insight block (lines 525-558) repeats prompt generation 6 times; makeSkill() boilerplate is duplicated across 5 locations. Consolidating these — generating the prompt once per describe block and asserting against the result — would significantly reduce duplication. Many tests overlap with `src/__tests__/prompt-builders.test.ts` which tests builders directly; evidence-bearing tests should move there while pure-dispatch tests stay. Check `.shoe-makers/claim-evidence.yaml` before removing any test to preserve invariant evidence.

Files: `src/__tests__/prompts.test.ts`, `src/__tests__/prompt-builders.test.ts`, `.shoe-makers/claim-evidence.yaml`

## 2. Wire skill validation patterns into critique prompt
**Type**: implement
**Impact**: high
**Reasoning**: The spec (`wiki/pages/structured-skills.md`) says "the adversarial reviewer checks validation patterns — format compliance is enforced by the system." The code has `parseValidationPatterns()` in `src/skills/registry.ts` (lines 104-116) which parses patterns from skill markdown files, but these patterns are never checked or surfaced. The critique prompt (`src/prompts/reactive.ts`) doesn't include validation patterns for the reviewer to verify. Wiring this up: (1) add validation patterns to skill markdown files in `.shoe-makers/skills/`, (2) pass parsed patterns into the critique prompt so reviewers can check format compliance. This closes a spec-code gap described in structured-skills.md section "Validation".

Files: `src/skills/registry.ts`, `src/prompts/reactive.ts`, `.shoe-makers/skills/*.md`

## 3. Surface process patterns in explore prompt
**Type**: implement
**Impact**: medium
**Reasoning**: `computeProcessPatterns()` in `src/log/shift-log-parser.ts` calculates reactive ratio, review loop count, and innovation cycle count. The assessment stores these in `processPatterns`. But the explore prompt (`src/prompts/explore.ts`) doesn't include them. The spec says explore should receive process signals so the explorer can adjust priorities (e.g., high reactive ratio suggests systemic issues, repeated review loops suggest unclear specs). Adding a "Process signals" section to the explore prompt would close this gap and make exploration more informed.

Files: `src/prompts/explore.ts`, `src/log/shift-log-parser.ts`, `src/types.ts`

## 4. Consolidate world.test.ts temp dir setup (score 91)
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/__tests__/world.test.ts` (399 lines, score 91) has 7 separate `describe` blocks each with their own `beforeEach`/`afterEach` for temp directory management using `mkdtemp` + `git init` + `git commit --allow-empty`. Extracting a shared `withTempRepo(async (dir) => { ... })` helper would reduce boilerplate and improve the score.

Files: `src/__tests__/world.test.ts`, `src/__tests__/test-utils.ts`

## 5. Add skill context interpolation to execute prompt
**Type**: implement
**Impact**: medium
**Reasoning**: The spec (`wiki/pages/structured-skills.md`) describes setup gathering context and interpolating it into skill templates before handing to the elf. `interpolateSkillContext()` exists in `src/skills/registry.ts` (lines 135-144) but is never called. Currently, the execute prompt is built from hardcoded functions in `src/prompts/execute.ts`. Connecting the skill registry's interpolation to the execute prompt builder would make skills actually template-based rather than decorative. This is a larger change but directly addresses the structured-skills spec.

Files: `src/skills/registry.ts`, `src/prompts/execute.ts`, `src/setup.ts`
