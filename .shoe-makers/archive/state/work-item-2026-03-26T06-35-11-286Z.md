skill-type: doc-sync

# Document continue-work action in behaviour-tree wiki page

## Wiki Spec

`wiki/pages/behaviour-tree.md` line 25 mentions partial work:
```
├── [partial work?]                   → Continue partial work (direct prompt)
```

Line 44 has a brief description:
```
- **Partial work** — a previous elf started work but didn't finish. The elf reads the partial-work description and resumes where the previous elf left off.
```

Other reactive actions like "Tests failing", "Unresolved critiques", and "Unreviewed commits" each get a multi-sentence explanation. The partial-work action gets only one sentence — less detail than its peers.

## Current Code

`src/prompts/continue-work.ts` generates the continue-work prompt. It instructs the elf to:
1. Read `.shoe-makers/state/partial-work.md`
2. Resume the described work
3. Delete `partial-work.md` when done (or update it if still incomplete)
4. Run tests

`src/tree/default-tree.ts` line 112: `makeConditionAction("partial-work", hasPartialWork, "continue-work")`

`src/verify/permissions.ts` lines 45-49: continue-work has executor-level permissions (src/, wiki/, .shoe-makers/state/, etc.)

Related finding: `.shoe-makers/findings/unspecified-partial-work.md` — notes this is undocumented in invariants.

## What to Build

Add 2-3 sentences to the "Partial work" bullet in `wiki/pages/behaviour-tree.md` line 44 to explain:
- What triggers it: existence of `.shoe-makers/state/partial-work.md`
- What the elf does: reads the partial-work file, resumes work, deletes the file when done (or updates it for the next elf)
- Permission level: same broad permissions as execute-work-item (can write src/, wiki/)
- When it's created: any elf can write partial-work.md to hand off incomplete work

Keep it concise — match the documentation depth of the other reactive actions (2-4 sentences each).

## Patterns to Follow

Match the style of other reactive action descriptions in the same section:
```
- **Tests failing** — always highest priority. The elf gets the test output and fixes it.
- **Review-loop circuit breaker** — two nodes handle review loops. If candidates already exist...
```

## Tests to Write

No tests needed — wiki documentation change only. Run `bun test` to verify nothing breaks.

## What NOT to Change

- Do NOT modify source code
- Do NOT modify `.shoe-makers/invariants.md`
- Only expand the existing partial-work description in `wiki/pages/behaviour-tree.md`

## Decision Rationale

Candidate #3 (doc-sync) chosen over #1 (shift error tests) and #2 (file split) because the setup guidance says to "prefer improvement and creative work over writing more tests or polishing what's already clean." The partial-work documentation gap is referenced by an open finding and improves the wiki spec for future contributors and elves.
