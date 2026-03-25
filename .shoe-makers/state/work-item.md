# Add direct unit tests for countUnresolvedCritiques from world.ts

skill-type: test-coverage

## Problem

`src/state/world.ts` exports `countUnresolvedCritiques()` which drives the "unresolved-critiques" tree condition — one of the highest-priority reactive conditions in the behaviour tree. The function is currently tested only via a local reimplementation in `src/__tests__/critique-detection.test.ts:80` that duplicates the logic rather than importing and testing the real function. The other world.ts utility functions (`checkHasWorkItem`, `checkHasCandidates`, `readWorkItemSkillType`, `countInsights`) already have proper direct tests in `world.test.ts`.

## What to do

Add a `describe("countUnresolvedCritiques", ...)` block to `src/__tests__/world.test.ts` that imports and tests the real `countUnresolvedCritiques` function from `src/state/world.ts`.

### Import

Add `countUnresolvedCritiques` to the existing import line (line 6):
```typescript
import { readWorldState, checkUnreviewedCommits, readWorkItemSkillType, checkHasWorkItem, checkHasCandidates, countInsights, hasUncommittedChanges, countUnresolvedCritiques } from "../state/world";
```

### Test cases

Follow the same pattern as the existing `checkHasWorkItem` tests (temp dir, beforeEach/afterEach with mkdtemp/rm):

1. **returns 0 when findings directory does not exist** — new temp dir, no .shoe-makers/findings
2. **returns 0 when findings directory is empty** — mkdir findings dir, no files
3. **returns 0 when no critique files exist** — only a non-critique file like `invariant-update.md`
4. **counts unresolved critiques** — write 2 critique files without `## Status\nResolved.`, expect count 2
5. **ignores resolved critiques** — write a critique with `## Status\nResolved.` at the bottom, expect count 0
6. **counts mix of resolved and unresolved** — write 3 critiques (2 resolved, 1 not), expect count 1
7. **ignores files not starting with "critique-"** — write `invariant-update-2026-03-25.md` without resolved status, expect count 0
8. **ignores non-.md files** — write `critique-2026-03-25-001.txt`, expect count 0

### Test data format

Critique files with resolved status should have:
```markdown
# Critique: some title

...content...

## Status

Resolved.
```

Unresolved critique files should NOT have the `## Status\nResolved.` pattern.

## What NOT to change

- Do not modify `src/state/world.ts` — only add tests
- Do not modify `src/__tests__/critique-detection.test.ts` — it tests different things (the detection flow)
- Do not modify any other files
- Do not delete or skip existing tests

## Decision Rationale

Candidate #1 was chosen because `countUnresolvedCritiques` is the only world.ts utility function lacking a direct test. It drives a critical tree condition (higher priority than explore/prioritise/execute). The existing local copy in critique-detection.test.ts tests the logic but doesn't test the actual exported function — a refactoring bug could silently break the real function while the copy passes. Candidates #2 (formatSkillSection) and #3 (doc-sync) were deprioritised: #2 is a trivial one-liner, and #3 is already up to date in the wiki (only invariants.md needs human updating).
