skill-type: test-coverage

# Add tests for assess.ts (core assessment engine)

## Wiki Spec

From `wiki/pages/architecture.md`: Each tick, the system reads the world state (branch status, test results, invariant counts) and routes to the appropriate agent. The assessment is the foundation — everything downstream depends on it being correct.

From `wiki/pages/verification.md`: "The invariants pipeline surfaces specified-only, untested, and unspecified claims as work."

## Current Code

`src/skills/assess.ts` (218 lines) — the core assessment engine, called every tick via `bun run setup`. It has **zero test coverage**.

Key exported functions:
- `assess(repoRoot)` (line 178) — orchestrates 8 parallel data sources into an Assessment object, writes to blackboard
- `buildSuggestions(assessment, options?)` (line 154) — generates human-readable suggestions from assessment data
- `archiveResolvedFindings(repoRoot)` (line 91) — moves resolved findings to archive/, also archives expired notes (>24h)
- `runTests(repoRoot)` (line 31) — runs `bun test` and returns boolean

Key internal functions:
- `findOpenPlans(repoRoot, wikiDir)` (line 62) — scans wiki/pages/ for frontmatter `category: plan`
- `readFindings(repoRoot)` (line 129) — reads all .md files from findings/
- `getRecentGitActivity(repoRoot)` (line 16) — runs `git log --oneline -10`

## What to Build

Create `src/__tests__/assess.test.ts` with tests for the pure/testable functions. Use temp directories (mkdtemp pattern from existing tests) to avoid touching real state.

Focus on functions that can be tested without running real `bun test` or `tsc`:

1. **`buildSuggestions()`** — pure function, easy to test:
   - Returns empty array for null assessment
   - Returns suggestion for specifiedOnly > 0
   - Returns suggestion for implementedUntested > 0
   - Returns suggestion for openPlans
   - Returns suggestion for findings (default)
   - Omits findings suggestion when `includeFindings: false`
   - Returns multiple suggestions when multiple conditions met

2. **`archiveResolvedFindings()`** — file I/O, testable with temp dirs:
   - Returns empty array when findings dir doesn't exist
   - Ignores non-.md files
   - Archives files with `## Status\nResolved` pattern
   - Leaves unresolved files in place
   - Creates archive/ subdirectory if needed
   - Archives expired note- files older than 24h
   - Keeps non-expired note- files

3. **`findOpenPlans()`** — not exported, but `readFindings()` is testable:
   - Returns empty when findings dir doesn't exist
   - Reads .md files and returns Finding objects with id and content
   - Ignores non-.md files

## Patterns to Follow

Follow the pattern in `src/__tests__/world-critiques.test.ts`:
- Use `mkdtemp` + `tmpdir()` for temp directories
- Use `beforeEach`/`afterEach` for setup/teardown with `rm(tempDir, { recursive: true, force: true })`
- Import from `bun:test` (`describe`, `test`, `expect`, `beforeEach`, `afterEach`)
- Group tests in `describe()` blocks by function
- Test edge cases: empty dirs, missing dirs, mixed content

## Tests to Write

1. `describe("buildSuggestions")` — 7 tests covering all suggestion conditions
2. `describe("archiveResolvedFindings")` — 7 tests covering archive behaviour
3. `describe("readFindings")` — 3 tests (note: readFindings is not exported, so test via assess() or consider if it should be tested indirectly)

Since `readFindings` is private, focus on `buildSuggestions` and `archiveResolvedFindings` which are both exported.

## What NOT to Change

- Do NOT modify `src/skills/assess.ts` — only add tests
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any existing test files
- Do NOT try to test `runTests()` or `runTypecheck()` — they execute real commands
- Do NOT try to test `assess()` end-to-end — it requires too many real dependencies

## Decision Rationale

Chose assess.ts over permissions.ts (candidate #2) because: assess.ts is called every single tick and its output drives all tree routing decisions. A bug in `buildSuggestions()` could cause the system to miss work opportunities; a bug in `archiveResolvedFindings()` could cause findings to accumulate forever or be lost prematurely. The `buildSuggestions()` function is also pure and trivially testable, making this high-value-per-effort. Permissions.ts is important but the permission model is already validated by the adversarial review process.
