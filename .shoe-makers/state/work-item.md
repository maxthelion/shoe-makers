skill-type: test-coverage

# Add integration tests for buildWorldState()

## Wiki Spec

`wiki/pages/behaviour-tree.md` describes the world state as the input to the behaviour tree. `wiki/pages/architecture.md` describes the tick loop: "each tick reads the world state and routes to the appropriate agent." The `buildWorldState()` function is the bridge between assessment and tree evaluation.

## Current Code

`src/setup/world-state.ts` (45 lines) exports `buildWorldState()` which:
1. Takes `repoRoot`, `branchName`, `assessment`, `inboxCount`, `config` as inputs
2. Runs 8 parallel I/O operations via `Promise.all` (lines 12-21)
3. Assembles a `Blackboard` (lines 23-28)
4. Returns a complete `WorldState` object (lines 30-43)

The individual utility functions it calls (`checkHasWorkItem`, `checkHasCandidates`, etc.) are tested in `src/__tests__/world-state.test.ts`. But `buildWorldState()` itself has zero test coverage — no test file imports it.

## What to Build

Create `src/__tests__/build-world-state.test.ts` with integration tests:

1. **Basic assembly test**: mock the filesystem (create/don't create work-item.md, candidates.md, etc.), call `buildWorldState()`, verify the returned `WorldState` has correct field values.

2. **Empty repo test**: call with a temp directory that has no `.shoe-makers/` structure, verify defaults (false/0/null for all boolean/count/nullable fields).

3. **Field mapping test**: create specific state files (work-item.md, candidates.md, a critique finding, insights), call `buildWorldState()`, verify each field maps correctly: `hasWorkItem: true`, `hasCandidates: true`, `unresolvedCritiqueCount: 1`, `insightCount: 1`.

4. **Passthrough test**: verify that `branchName`, `assessment`, `inboxCount`, and `config` are passed through unchanged to the returned object.

Use `mkdtemp` for temp directories (follow pattern in `src/__tests__/shift-log-parser.test.ts`). Use a minimal assessment object matching the `assess` return type.

## Patterns to Follow

- Follow `src/__tests__/shift-log-parser.test.ts` for temp directory setup/teardown pattern
- Follow `src/__tests__/world-state.test.ts` for how individual state-check functions are tested
- Use `describe/test` blocks, not `it`
- Keep test file name matching the source file convention: `build-world-state.test.ts`

## Tests to Write

All tests listed in "What to Build" above. Minimum 3 tests, aim for 4-5 covering the integration points.

## What NOT to Change

- Do NOT modify `src/setup/world-state.ts` — we're testing it as-is
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify existing test files
- Do NOT modify any wiki pages

## Decision Rationale

Candidate #1 (buildWorldState tests) is the highest impact: this function is the single integration point between assessment and tree evaluation. A bug here silently breaks all routing. Candidate #2 (stale invariants) is off-limits to elves. Candidate #3 (health scores) is lower impact — 99/100 is already excellent.
