# Add Decision Rationale to Prioritise Prompt

skill-type: improve

## Context

In `src/prompts/three-phase.ts:buildPrioritisePrompt` (line 120-128), step 5 tells the prioritise elf what to include in work-item.md. Currently it asks for: title, skill-type, wiki text, code references, what to build, patterns, tests, and what NOT to change.

Missing: **why** this candidate was chosen over the others. Without this, humans reviewing the morning branch can't understand the prioritisation reasoning.

## What to Change

In `src/prompts/three-phase.ts`, modify step 5 of `buildPrioritisePrompt` to add one more bullet point asking for a decision rationale section.

### Specific change

In the step 5 list (lines 120-128), add after "What NOT to change":
```
   - A brief "## Decision Rationale" explaining why this candidate was chosen over the others
```

### Tests to Write

In `src/__tests__/prompts.test.ts`, add a test verifying the prioritise prompt includes "Decision Rationale" text.

### Patterns to Follow

- This is a prompt template change — keep the same markdown formatting style
- One new bullet point in an existing list
- One new test case following the existing pattern in prompts.test.ts

### What NOT to Change

- Do NOT modify the `ShiftSummary` or shift-log code
- Do NOT modify wiki pages or invariants
- Do NOT modify the explore or execute prompts
- Keep the change minimal — one bullet point addition
