# Add tests for getShiftProcessPatterns async wrapper

skill-type: test

## Context

`src/log/shift-log-parser.ts` exports `getShiftProcessPatterns(repoRoot)` at line 91. It reads the current day's shift log and delegates to `parseShiftLogActions` + `computeProcessPatterns`. The pure functions have 14 tests, but the async file-reading wrapper has zero direct tests.

This function is called by `src/skills/assess.ts` to populate `assessment.processPatterns`, which affects tier routing in the behaviour tree (high reactive ratio triggers different explore guidance).

## What to build

Add a new `describe("getShiftProcessPatterns", ...)` block to `src/__tests__/shift-log-parser.test.ts`. Import the function on line 2.

### Tests to add:

1. **Returns undefined when no shift log exists**
   - Create a temp dir with no log files
   - Call `getShiftProcessPatterns(tempDir)`
   - Expect `undefined`

2. **Returns undefined when shift log has no actions**
   - Create `.shoe-makers/log/YYYY-MM-DD.md` with just a header (no action lines)
   - Expect `undefined` (because `actions.length === 0` returns undefined, line 98)

3. **Returns process patterns from a real shift log**
   - Create `.shoe-makers/log/YYYY-MM-DD.md` with action entries
   - Verify returned patterns have expected `reactiveRatio`

### Pattern to follow

Use `mkdtemp`/`rm` for temp dirs, `mkdir` recursive for nested paths. Use today's date for the log filename (the function uses `new Date().toISOString().slice(0, 10)`). Import `mkdtemp, rm, mkdir, writeFile` from `fs/promises`, and `join` from `path`, `tmpdir` from `os`.

## What NOT to change

- Do not modify `src/log/shift-log-parser.ts`
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 chosen because it tests a gap in a function that feeds the behaviour tree's tier routing. The other candidates (test helper consolidation, doc-sync for invariants page) are lower impact cosmetic improvements.
