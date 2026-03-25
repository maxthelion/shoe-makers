# Candidates

## 1. Add tests for shift-log-parser edge cases
**Type**: test-coverage
**Impact**: high
**Reasoning**: `src/log/shift-log-parser.ts` parses shift log entries to detect process patterns like review loops and innovation cycles (used by `src/log/shift-summary.ts`). The `processPatterns` data drives critical behaviour tree decisions — `inReviewLoop` (tree line 31) breaks out of review loops at count >= 3, and `innovationTier` (tree line 74) caps innovation cycles. `src/__tests__/shift-log-parser.test.ts` exists (testing basic parsing) but the connection between parsed entries and the `reviewLoopCount`/`innovationCycleCount` values used in tree conditions is the critical path. If the parser miscounts, the tree routes incorrectly. Adding tests that verify the full chain — log text → parsed patterns → correct counts — would catch regressions in this safety-critical logic.

## 2. Test coverage for `src/verify/permissions.ts` boundary conditions
**Type**: test-coverage
**Impact**: high
**Reasoning**: `src/verify/permissions.ts` enforces role-based file write permissions per invariant 3.3. `src/__tests__/permissions.test.ts` exists but the permission model changed recently (executor role can now write test files — per CHANGELOG "Fixed" section). Boundary conditions matter here: what happens when an action type is unknown? What if a file path contains `..` traversal? What if the same file appears in both permitted and off-limits lists? These edge cases in security-critical code deserve explicit tests.

## 3. Add test for `checkHasPartialWork` world state reader
**Type**: test-coverage
**Impact**: medium
**Reasoning**: `hasPartialWork` is a relatively new WorldState field (added to support the `continue-work` tree node at line 110 of `default-tree.ts`). While `src/__tests__/default-tree.test.ts` tests the tree routing for this field (lines 150-175), the underlying `checkHasPartialWork` function in `src/state/world.ts` that reads the actual file system state should have its own unit test. If the detection logic has a bug (e.g. wrong file path, race condition with archiving), the tree would skip partial work silently.

## 4. Sync CHANGELOG.md with recent session work
**Type**: doc-sync
**Impact**: low
**Reasoning**: Per invariant 3.5, "The CHANGELOG tracks user-facing changes in Keep a Changelog format." Recent sessions added: config enabled-skills edge case tests, `continue-work` action type, `parseActionTypeFromPrompt` round-trip drift test, action-classification drift-prevention test, and partial-work detection. Some of these are internal quality improvements, but the `continue-work` action and partial-work detection are user-facing behaviour changes that should appear in the CHANGELOG under [Unreleased].

## 5. Add test for `archiveConsumedStateFiles` with concurrent state changes
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/archive/state-archive.ts` (51 lines) archives consumed state files for traceability. `src/__tests__/state-archive.test.ts` exists, but the function is called during setup (line 117-121 of `setup.ts`) just before the elf starts working. If the elf writes a new `candidates.md` or `work-item.md` while archiving is still completing (unlikely but possible), there could be a race. A test verifying that archiving only moves files that existed at call time would document the expected behaviour.
