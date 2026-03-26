# Wire skill validation patterns into critique prompt

skill-type: implement

## What the spec says

From `wiki/pages/structured-skills.md` (section "Validation"):
> Each skill template includes a validation section with patterns the output must match (e.g. the critique status regex).
> The adversarial reviewer checks validation patterns — format compliance is enforced by the system, not remembered by the elf.

From `.shoe-makers/invariants.md` (section 3.2.1):
> Each skill template includes a validation section with patterns the output must match
> The adversarial reviewer checks validation patterns — format compliance is enforced by the system

## What the code has

`src/skills/registry.ts`:
- `parseValidationPatterns()` (lines 104-116) — parses `## Validation` sections from skill markdown, extracting backtick-wrapped regex patterns as strings
- `SkillDefinition.validationPatterns: string[]` (line 21) — the parsed patterns are stored here
- `loadSkills()` already calls `parseValidationPatterns()` via `parseSkillFile()`

`src/prompts/reactive.ts`:
- `buildCritiquePrompt(permissionViolations?)` — currently accepts only permission violations, not validation patterns
- The critique prompt tells the reviewer to check 5 criteria but doesn't mention validation patterns

`src/setup.ts`:
- Calls `generatePrompt("critique", ...)` with skills and violations
- Skills are loaded via `loadSkills()` and passed around

`.shoe-makers/skills/*.md`:
- None of the 9 skill files currently have a `## Validation` section
- This means `validationPatterns` is always `[]`

## What to build

### 1. Add validation patterns to key skill files

Add `## Validation` sections to the skills that have deterministic output requirements:

**`.shoe-makers/skills/fix-tests.md`** — add:
```
## Validation

- `bun test`
- `All tests pass`
```

**`.shoe-makers/skills/doc-sync.md`** — add:
```
## Validation

- `wiki/pages/`
```

**`.shoe-makers/skills/implement.md`** — add:
```
## Validation

- `bun test`
- `src/`
```

### 2. Pass validation patterns to the critique prompt

In `src/prompts/reactive.ts`, modify `buildCritiquePrompt()`:
- Add a `validationPatterns?: string[]` parameter
- When patterns are provided and non-empty, add a section to the critique prompt like:

```
## Validation patterns to check

The previous elf's skill requires that output matches these patterns:
- `pattern1`
- `pattern2`

Check whether the elf's work satisfies these validation requirements.
```

### 3. Wire the patterns through generatePrompt

In `src/prompts/index.ts`, when generating a critique prompt:
- Look up the skill that was used for the last action (from `last-action.md` or the skills map)
- Extract its `validationPatterns`
- Pass them to `buildCritiquePrompt()`

The skill type can be determined from the `last-action.md` file via `parseActionTypeFromPrompt()` + `ACTION_TO_SKILL_TYPE`.

### 4. Write tests

In `src/__tests__/prompt-builders.test.ts`, add tests:
- `buildCritiquePrompt` includes validation patterns when provided
- `buildCritiquePrompt` omits validation section when patterns empty/undefined
- Integration: generatePrompt("critique", ...) with skills that have validation patterns

In `src/__tests__/registry.test.ts`, verify:
- `parseSkillFile` extracts validation patterns from `## Validation` section

## Patterns to follow

- Follow the existing permission violations pattern in `buildCritiquePrompt()` — same approach (optional parameter, conditional section)
- Validation patterns are already parsed by the registry; just need to be surfaced
- Keep the critique prompt focused — validation patterns supplement, not replace, the 5 review criteria

## What NOT to change

- Do not modify `parseValidationPatterns()` — it already works correctly
- Do not modify `.shoe-makers/invariants.md`
- Do not change the tree routing logic
- Do not add overly complex validation patterns — start simple, iterate

## Decision Rationale

Candidate #2 was chosen because:
1. **Highest impact**: closes a spec-code gap with clear implementation path
2. **All infrastructure exists**: parsing is implemented, just needs wiring
3. **Addresses inbox priority**: the structured-skills inbox message specifically asked for this kind of work
4. **Improves elf quality**: validation patterns reduce wasted ticks on format compliance

Candidates #1 (prompts.test.ts health) was partially addressed in the inbox handling tick. Candidates #3-5 are lower priority — process patterns and skill interpolation can be done after the validation wiring proves the pattern.
