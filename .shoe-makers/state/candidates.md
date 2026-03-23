# Candidates

## 1. Add evidence patterns for README-reflects-capabilities invariant
**Type**: implement
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Invariant `spec.project-documentation.the-readme-reflects-current-capabilities` is specified-only. The README already accurately describes current capabilities. Adding an evidence pattern that checks for key README content strings (like "behaviour tree", "three-phase", "bun run setup") in source code or init templates would properly classify this as implemented-tested. Quick win: reduces specified-only count. Affects `.shoe-makers/claim-evidence.yaml`.

## 2. Add README accuracy check to explore prompt
**Type**: implement
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Invariant `spec.project-documentation.the-explore-step-checks-whether-the-readme-is-accurate` is specified-only because the explore prompt in `src/prompts.ts:169-199` doesn't mention README checking. Add a step 7 to the explore prompt: "Check whether README.md accurately describes the current capabilities — flag drift as a candidate." This is a one-line prompt change that activates a specified invariant.

## 3. Wire prioritise/verify/work skills into scheduler
**Type**: implement
**Impact**: medium
**Confidence**: medium
**Risk**: medium
**Reasoning**: `src/skills/prioritise.ts`, `src/skills/verify.ts`, `src/skills/work.ts` exist with tests (203, 161, 139 lines) but are never called from production code. `src/scheduler/run-skill.ts` should dispatch to these. Flagged in `spec-code-audit-2026-03-22.md`. Risk: these skills assume blackboard state that may not match the current setup.ts flow.

## 4. Add `insightFrequency` to `.shoe-makers/config.yaml`
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The config.yaml file doesn't document `insight-frequency` even though the code now supports it. Adding `insight-frequency: 0.3` with a comment to the default config template (`src/init-templates.ts` CONFIG_CONTENT) and to the project's `.shoe-makers/config.yaml` ensures discoverability.

## 5. Improve health score by splitting `src/init-skill-templates.ts`
**Type**: health
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `init-skill-templates.ts` scores 92/100 (worst file) at 378 lines of string templates. Could split into separate files per skill template or extract to YAML. Health score dropped from 100 to 99 after the Wikipedia integration — addressing the worst file could restore it.
