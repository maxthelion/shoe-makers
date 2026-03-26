# Fix README innovation tier duplication

skill-type: doc-sync

## Context

`README.md` has a duplicated paragraph about the innovation tier. Lines 33 and 37 say essentially the same thing.

## What to do

Remove the standalone paragraph at line 37 ("When all invariants are met and code health is good, the system enters the **innovation tier**...") because line 33 already explains the same concept in better context ("At **innovation tier** (all invariants met, health good), the tree routes to **Innovate** instead of Explore...").

The paragraph to remove is:
```
When all invariants are met and code health is good, the system enters the **innovation tier**: prompted with a random Wikipedia article as an analogical lens, the elf writes a creative insight. A separate evaluation phase (generous/convergent disposition) decides whether to promote the insight to a work item, rework it, or dismiss it.
```

Keep everything else unchanged. The blank line between "Each phase narrows..." and "## The wiki is the spec" should remain.

## What NOT to change

- Do NOT modify any other section of the README
- Do NOT add new content
- Do NOT change the wiki pages

## Decision Rationale

Picked candidate #1 over #2 (test coverage) and #3 (test file split) because the state prefers "improvement and creative work over writing more tests or polishing what's already clean." README clarity is a direct user-facing improvement. The other candidates are low-impact test/health work with diminishing returns.
