# Update behaviour-tree.md to document partial-work node

skill-type: doc-sync

## Context

The `partial-work` condition and `continue-work` action were just implemented in `src/tree/default-tree.ts`. The wiki page `wiki/pages/behaviour-tree.md` needs to be updated to match.

## What to change

### 1. Update the tree diagram (lines 19-33)

Add the partial-work node between "unresolved critiques" and "unreviewed commits":

```
├── [unresolved critiques?] → Fix critiques (direct prompt)
├── [partial work?] → Continue partial work (direct prompt)
├── [unreviewed commits?] → Review adversarially (direct prompt)
```

### 2. Update the reactive zone description (lines 35-44)

Add a bullet for partial work between "Unresolved critiques" and "Unreviewed commits":

```
- **Partial work** — a previous elf started work but didn't finish. The elf reads the partial-work description and resumes.
```

### 3. Update state files section (lines 70-76)

Add `partial-work.md` to the state files list:

```
  partial-work.md   ← written by agent on partial exit, read by continue-work
```

## Files to modify

- `wiki/pages/behaviour-tree.md` — three surgical updates as described above

## Files NOT to modify

- `.shoe-makers/invariants.md` — human only
- Any source files in `src/` — this is a doc-sync, not code

## Tests

No code changes, so no tests needed. Run `bun test` to confirm nothing breaks.

## Decision Rationale

Chosen over other candidates because:
- The wiki is the source of truth and it's now behind the code — highest priority to fix
- The previous critique explicitly noted this as a follow-up doc-sync candidate
- Candidates #2 (pure-function-agents.md) and #3 (archive fix) are valid but lower impact
- This keeps the spec accurate for future elves who read the wiki to understand the tree
