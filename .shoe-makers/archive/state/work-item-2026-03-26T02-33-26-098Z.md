skill-type: implement

# Add structured-skills claim-evidence patterns — close all 11 remaining specified-only gaps

## Wiki Spec

From `wiki/pages/structured-skills.md` — the 11 claims are about the semi-deterministic template pattern: mechanical/intelligent separation, pre-filled templates, setup context gathering, validation sections, deterministic housekeeping, etc.

## Current Code

All structured skills are implemented:
- `src/prompts/explore.ts` — pre-filled candidate template with `[YOUR TITLE HERE]`, `[YOUR REASONING HERE]`
- `src/prompts/prioritise.ts` — pre-filled work-item template with `[YOUR CONTENT HERE]` placeholders
- `src/prompts/innovate.ts` — pre-filled insight template with Lens/Connection/Proposal/Why sections
- `src/prompts/evaluate-insight.ts` — pre-filled evaluation template with Evaluation/Build On It/Decision sections
- `src/prompts/critique.ts` — structured critique format with `[YOUR JUDGEMENT HERE]` placeholders
- `src/setup.ts` — gathers context (assessment, diff, last-action, wiki, skills) and interpolates into prompts
- `src/setup/housekeeping.ts` — deterministic archiving and shift log updates

## What to Build

Create `.shoe-makers/claim-evidence/25-structured-skills.yaml` with evidence patterns for all 11 claims. Match patterns against existing source code.

## Patterns to Follow

Follow `.shoe-makers/claim-evidence/24-creative-corpus.yaml` format.

## Tests to Write

None — YAML evidence pattern work only.

## What NOT to Change

- Do not modify any source code in `src/`
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate 1 closes all 11 remaining gaps with a single YAML file, dropping specified-only to 0 or near 0.
