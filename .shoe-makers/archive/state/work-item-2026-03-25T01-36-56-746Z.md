skill-type: doc-sync

# Update verification wiki page with orchestration skip and circuit breaker

## Context

Two architectural changes need documenting in `wiki/pages/verification.md`:

1. **Orchestration skip**: Commits touching only `.shoe-makers/` orchestration dirs (findings, insights, log, archive, state) no longer trigger adversarial review. This was implemented in `src/verify/detect-violations.ts:getElfChangedFiles()`.

2. **Review-loop circuit breaker**: A new tree condition (`review-loop-breaker`) breaks out of critique/fix-critique loops after 3 iterations by routing to explore. This was added to `src/tree/default-tree.ts`.

The wiki is the source of truth — these changes need to be documented there.

## What to change

### File: `wiki/pages/verification.md`

1. **In the "Cross-Elf Gatekeeping" section**, add a subsection after "How it works" (around line 52):

```markdown
### Orchestration skip

Not all commits need adversarial review. Commits that only touch orchestration output directories are automatically skipped:

- `.shoe-makers/state/` — orchestration state files (candidates.md, work-item.md)
- `.shoe-makers/findings/` — critique findings
- `.shoe-makers/insights/` — creative insights
- `.shoe-makers/log/` — shift log entries
- `.shoe-makers/archive/` — archived files

These are mechanical outputs of the tree cycle, not code changes. Skipping review for them prevents the system from spending most of its shift reviewing low-risk orchestration artifacts.

Commits that touch `src/`, `wiki/`, or any real code still trigger full adversarial review.
```

2. **In the "Tree Order" section** (around line 110), update the tree diagram to include the circuit breaker:

```
Selector
├── [tests failing?] → Fix them
├── [review loop ≥3?] → Break out to explore
├── [unresolved critiques?] → Fix the flagged issues
├── [unreviewed commits?] → Review adversarially (critique)
├── [uncommitted work?] → Review before committing (review)
├── [inbox messages?] → Read and act
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [neither?] → Explore: write candidates.md
```

3. **Add a brief note** after the tree diagram explaining the circuit breaker:

```markdown
The review-loop circuit breaker prevents infinite critique/fix-critique cycles. If the shift has seen 3+ review loop iterations (detected via the shift log parser), the tree routes to explore instead of continuing the loop. This ensures the shift makes progress even when a critique can't be resolved.
```

## What NOT to change

- Do not modify `src/` files — this is a doc-sync only
- Do not modify `.shoe-makers/invariants.md`
- Do not modify other wiki pages unless they reference the tree order

## Decision Rationale

Candidate #2 was chosen over #1 (README) because the wiki is the source of truth — code derives from the spec, not vice versa. Documenting architectural changes in the wiki is higher priority than updating the README. The README can be updated in a follow-up cycle.
