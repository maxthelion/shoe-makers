skill-type: implement

# Implement structured innovate skill — pre-filled insight output template

## Wiki Spec

From `wiki/pages/structured-skills.md` lines 84-87:

> **write-insight** — innovate phase output
> - Setup provides: wiki summary, Wikipedia article
> - Template defines: required sections (Lens with article title, Connection, Proposal, Why), file path (auto-numbered), the article MUST be referenced
> - Elf provides: the creative connection

From `wiki/pages/structured-skills.md` lines 17-21 (the pattern):

> Skills should handle the mechanical part completely. The setup script gathers context and slots it into the skill template. The elf receives a prompt where all the structure is pre-filled and it only needs to provide the intelligent parts.

## Current Code

`src/prompts/innovate.ts` (lines 1-58): The innovate prompt describes the 4 required sections (Lens, Connection, Proposal, Why) in prose at lines 52-56, but uses a numbered list format rather than a pre-filled markdown template with `[YOUR CONTENT HERE]` placeholders. The sections are described as instructions rather than pre-filled into the output format.

The existing tests are in `src/__tests__/prompt-builders.test.ts` lines 306-342. They test: article inclusion, no-article fallback, wiki summary presence, insight file requirement, and section names. But they don't verify pre-filled template structure or placeholder patterns.

## What to Build

1. Update `src/prompts/innovate.ts` to replace the numbered list of sections (lines 52-56) with a pre-filled markdown template inside a code block, following the same pattern used in `src/prompts/explore.ts` and `src/prompts/prioritise.ts`:
   - Use a markdown code block with the exact output format
   - Include `[YOUR CONTENT HERE — ...]` placeholders for each section
   - Sections: `## Lens`, `## Connection`, `## Proposal`, `## Why`
   - For the Lens section when an article is provided, pre-fill the article title (e.g. `**Article Title** — [YOUR CONTENT HERE — describe what the article is about and how you'll use it as a lens]`)
   - Keep the dynamic article/no-article branching that already exists
   - Keep the file path instruction for `.shoe-makers/insights/YYYY-MM-DD-NNN.md`

2. Add a new test file `src/__tests__/innovate-prompt.test.ts` with tests that verify the structured template:
   - Pre-filled section headings are present (`## Lens`, `## Connection`, `## Proposal`, `## Why`)
   - `[YOUR CONTENT HERE` placeholders exist
   - With-article variant includes article title in template
   - Without-article variant has self-chosen lens placeholder

## Patterns to Follow

Follow the exact pattern from `src/prompts/prioritise.ts` lines 28-62:
- Use a markdown code block (triple backticks) containing the template
- Section headings use `##`
- Placeholder text uses `[YOUR CONTENT HERE — brief instruction]`
- The template is embedded in the prompt string as a literal code block

For the test file, follow `src/__tests__/prioritise-prompt.test.ts`:
- Import from the prompt module directly
- Use `expect(prompt).toContain(...)` for section headings and placeholders
- Group tests under a `describe("innovate prompt structured output", ...)` block

## Tests to Write

In `src/__tests__/innovate-prompt.test.ts`:
1. Test that all 4 section headings are present in the output (Lens, Connection, Proposal, Why)
2. Test that `[YOUR CONTENT HERE` placeholders exist
3. Test that with-article variant includes the article title in the template
4. Test that without-article variant includes self-chosen lens placeholder text
5. Test that the insight file path pattern is present

## What NOT to Change

- Do not modify the existing tests in `src/__tests__/prompt-builders.test.ts` — they test other aspects of the prompt
- Do not change the function signature of `buildInnovatePrompt`
- Do not change the wiki summary or article handling logic (the dynamic branching is correct)
- Do not modify `.shoe-makers/invariants.md`
- Do not modify any files outside `src/prompts/innovate.ts` and `src/__tests__/innovate-prompt.test.ts`

## Decision Rationale

Candidate 1 (structured innovate) chosen over candidate 2 (structured evaluate-insight) because the innovate skill is more complex — it has two variants (with/without article) that both need structuring. Completing innovate first establishes the pattern for the remaining evaluate-insight skill. Both close the same invariant gaps, but innovate sees more frequent use in the three-phase cycle. Candidate 3 (commit-or-revert evidence) is lower impact — it's a verification gap, not a missing feature.
