# Doc-sync: Fix remaining stale tick-type references in wiki pages

skill-type: doc-sync

## What to fix

Two wiki pages still reference the old tick-type model (ASSESS, PRIORITISE, VERIFY, WORK). Update them to use the current behaviour tree action terminology.

### File 1: `wiki/pages/observability.md` (line 56)

**Current:**
```
Findings are read by future agents during the ASSESS tick. They're part of the world state.
```

**Replace with:**
```
Findings are read by future agents during the explore action's assessment phase. They're part of the world state.
```

Rationale: There is no "ASSESS tick". The assessment runs as part of the setup script before the explore action. Findings are loaded during `assess()` in `src/skills/assess.ts`.

### File 2: `wiki/pages/open-questions.md` (line 39)

**Current:**
```
Multi-round review **emerges from the tick loop**. If the VERIFY tick rejects work (reverts), the next cycle's ASSESS tick sees the gap is still there, PRIORITISE re-ranks it, and WORK tries again. No special multi-round mechanism needed — the natural cycle handles retries.
```

**Replace with:**
```
Multi-round review **emerges from the behaviour tree loop**. If the critique action finds issues, the next cycle's tree routes to fix-critique, and after fixing, the tree re-evaluates. No special multi-round mechanism needed — the natural tree cycle handles retries. A circuit breaker (review-loop ≥3) prevents infinite loops.
```

Rationale: The old model described VERIFY tick → revert → ASSESS → PRIORITISE → WORK. The current model is: critique action → finding → fix-critique action → re-review. There's no revert step — issues are fixed forward. The circuit breaker is an important addition that wasn't in the original answer.

## Tests

No new tests needed — wiki-only change. Run `bun test` to confirm.

## What NOT to change

- Do NOT modify `src/` code
- Do NOT modify `.shoe-makers/invariants.md` (it also has stale tick references but is human-only)
- Do NOT restructure the wiki pages beyond the specific lines mentioned

## Decision Rationale

Candidate 1 was chosen because these are the last stale tick-type references in editable wiki pages. The open-questions.md reference is particularly misleading since it describes a revert-based model that no longer exists. Candidates 2-3 are low priority.
