skill-type: implement

# Implement structured evaluate-insight skill — pre-filled evaluation output template

## Wiki Spec

From `wiki/pages/structured-skills.md` lines 89-92:

> **evaluate-insight** — evaluate-insight phase output
> - Setup provides: insight file content
> - Template defines: required sections (evaluation, build-on-it, decision), decision options (promote/rework/dismiss), output format for each option
> - Elf provides: the evaluation and decision

From `wiki/pages/structured-skills.md` lines 17-21:

> Skills should handle the mechanical part completely. The setup script gathers context and slots it into the skill template. The elf receives a prompt where all the structure is pre-filled and it only needs to provide the intelligent parts.

## Current Code

`src/prompts/evaluate-insight.ts` (lines 1-33): The evaluate-insight prompt describes the three decision options (promote/rework/dismiss) in prose but doesn't use a pre-filled markdown template with `[YOUR CONTENT HERE]` placeholders. The promote option's work-item format is described as a bullet list rather than a pre-filled template.

Existing tests in `src/__tests__/prompt-builders.test.ts` lines 345-362: 3 tests verify generous disposition, three outcomes (Promote/Rework/Dismiss), and distinction from prioritise elf.

## What to Build

1. Update `src/prompts/evaluate-insight.ts` to add a pre-filled evaluation output template in a markdown code block. The template should include:
   - `## Evaluation` — what works, what doesn't, what variant would work
   - `## Build On It` — the elf's improved version of the idea
   - `## Decision` — one of promote/rework/dismiss with specific instructions for each
   - Each section uses `[YOUR CONTENT HERE — ...]` placeholders
   - Keep the existing prose about generous disposition, not being the prioritise elf, etc.
   - Add the template after the existing steps/instructions, as the output format specification

2. Create `src/__tests__/evaluate-insight-prompt.test.ts` with tests verifying the structured template.

## Patterns to Follow

Follow `src/prompts/innovate.ts` (the just-completed structured innovate skill):
- Use a markdown code block (triple backticks) containing the template
- Section headings use `##`
- Placeholder text uses `[YOUR CONTENT HERE — brief instruction]`

For tests, follow `src/__tests__/innovate-prompt.test.ts`:
- Import directly from `../prompts/evaluate-insight`
- Use `expect(prompt).toContain(...)` for section headings and placeholders
- Group tests under `describe("evaluate-insight prompt structured output", ...)`

## Tests to Write

In `src/__tests__/evaluate-insight-prompt.test.ts`:
1. Test that all 3 section headings are present (Evaluation, Build On It, Decision)
2. Test that `[YOUR CONTENT HERE` placeholders exist
3. Test that decision options (promote, rework, dismiss) are mentioned in the template
4. Test that the generous disposition text is preserved

## What NOT to Change

- Do not modify existing tests in `src/__tests__/prompt-builders.test.ts`
- Do not change the function signature of `buildEvaluateInsightPrompt`
- Do not modify `.shoe-makers/invariants.md`
- Do not modify any files outside `src/prompts/evaluate-insight.ts` and `src/__tests__/evaluate-insight-prompt.test.ts`

## Decision Rationale

Candidate 1 (structured evaluate-insight) is the last remaining three-phase skill to structure. Completing it closes the structured-skills invariant gaps for all three-phase skills. Candidates 2 and 3 are lower impact — candidate 2 is a verification evidence gap and candidate 3 is a health improvement, neither of which close as many invariant claims.
