skill-type: test-coverage

# Add edge case tests for src/state/world.ts functions

## Context

`src/__tests__/world.test.ts` (score 91) tests world state reader functions but is missing edge case coverage. The functions in `src/state/world.ts` have error handling paths (missing directories, empty files, git errors) that aren't covered by tests.

## What to test

### 1. `countInsights` edge cases
- Empty insights directory → returns 0
- Directory with non-.md files → returns 0
- Missing directory → returns 0 (already tested, but verify)

### 2. `countUnresolvedCritiques` edge cases
- Files not starting with `critique-` are ignored
- Files not ending with `.md` are ignored
- Resolved critiques (matching RESOLVED_PATTERN) are not counted
- Various Status line formats: `## Status\nResolved`, `## Status\n  Resolved.`, `## Status\nResolved — all clear`

### 3. `readWorkItemSkillType` edge cases
- File exists but has no skill-type line → returns null
- File exists with skill-type on line > 10 → returns null (only scans first 10 lines)
- skill-type with extra whitespace → returns trimmed value
- Case-insensitive matching: `Skill-Type: foo` → returns `foo`
- File doesn't exist → returns null

### 4. `checkUnreviewedCommits` edge cases
- Marker file with invalid content (not a hex hash) → returns true
- Marker file with short hash (7 chars) → treated as valid

## Patterns to follow

Follow the existing test patterns in `src/__tests__/world.test.ts`:
- Uses temp directories with `mkdtemp`
- Creates `.shoe-makers/state/`, `.shoe-makers/findings/`, `.shoe-makers/insights/` as needed
- Uses `afterEach` to clean up temp dirs
- For git-dependent tests, initializes a git repo in the temp dir

## What NOT to change

- Do not modify `src/state/world.ts` — only add tests
- Do not modify other test files
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #4 chosen because it's concrete, scoped, and directly improves the second-worst health score file (91). Candidate #1 (structured critique) is higher impact but requires design work. Candidate #2 (setup module tests) is also good but the setup modules just stabilized and may change again.
