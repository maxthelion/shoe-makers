# Sync docs with commit-or-revert verification gate

skill-type: doc-sync

## What to do

Update three files to document the new automated commit-or-revert verification gate that was just implemented in `src/verify/commit-or-revert.ts` and wired into `src/setup.ts`. Also mark the stale finding as resolved.

## Changes needed

### 1. `wiki/pages/verification.md` — Add Automated Verification Gate section

After the "## Principle" section (line 9) and before "## Roles and Permissions" (line 13), add a new section:

```markdown
## Automated Verification Gate

Before the behaviour tree evaluates, setup runs an automated commit-or-revert check on the previous elf's work. If the previous action was a work action (execute-work-item, fix-tests, fix-critique, dead-code, continue-work, inbox):

1. Run tests — if they fail, revert the last commit
2. Check health regression — if health dropped significantly, revert the last commit
3. If both pass, the commit stands and the tree proceeds normally

This gate ensures "what's on the branch passed checks" is mechanically enforced, not just reliant on the adversarial review cycle. The gate fires before the tree evaluation, so a reverted commit never reaches the review stage.

The gate is implemented as a pure function (`src/verify/commit-or-revert.ts`) — it takes test results and health status, returns "commit" or "revert". Setup handles the actual `git revert` side effect.

Orchestration actions (explore, prioritise, innovate, evaluate-insight) are exempt — they only write state files that don't need verification.
```

### 2. `README.md` — Add verification gate bullet to Quality Assurance

In the Quality Assurance section (line 45-51), add a bullet after "Tests must pass":

```markdown
- **Automated verification gate**: setup auto-reverts the elf's last commit if tests fail or code health regresses — bad work is caught before the review cycle even starts.
```

### 3. `wiki/pages/architecture.md` — Mention gate in The Invocation section

In "The Invocation" section (lines 14-19), add a step between step 1 and step 2:

```
1. Setup script evaluates the [[behaviour-tree]] against cached world state
1b. Setup runs the commit-or-revert gate — if the previous elf's work broke tests or regressed health, it's auto-reverted
2. Tree picks the first matching condition
...
```

### 4. Mark finding resolved

In `.shoe-makers/findings/stale-verification-invariants.md`, change the Status section from "Open" to "Resolved" to indicate the commit-or-revert gate has been implemented. Add a note: "Resolved — commit-or-revert verification gate implemented in src/verify/commit-or-revert.ts and wired into setup.ts."

## What NOT to change

- Do NOT modify `src/` — this is a doc-sync task only
- Do NOT modify `.shoe-makers/invariants.md` — human only
- Do NOT change the existing adversarial review documentation — the gate supplements it, doesn't replace it

## Decision Rationale

Doc-sync was chosen over health improvements because the new commit-or-revert gate is a significant capability that's completely undocumented. The wiki is the source of truth — if it doesn't describe the gate, future elves won't know it exists. Health improvements (candidates 2-4) are lower impact since the scores are already good (87-91).
