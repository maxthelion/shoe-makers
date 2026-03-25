# Stale verification invariants — commit-or-revert model

## Observation

The last 2 specified-only invariants reference a commit-or-revert verification model:

1. `verification.commit-or-revert` — "commit or revert" (from architecture group)
2. `spec.review-and-merge-with-confidence.verification-has-already-caught-and-reverted-bad-work-whats-` — "Verification has already caught and reverted bad work — what's on the branch passed checks"

The current system uses **cross-elf adversarial review** (critique → fix-critique → review loop) rather than an automated commit-or-revert gate. The claim-evidence entry `verification.commit-or-revert` looks for "commit" and "revert" patterns in source code that don't exist because the model was replaced.

## Evidence

- `wiki/pages/verification.md` describes the adversarial review model
- `src/verify/` has detection and permissions but no commit-or-revert gate
- The tree routes to `critique` for unreviewed commits, not to an automated verifier
- All 18 other invariants in this area are now resolved

## Recommendation

Human should either:
1. Update invariants.md to replace the commit-or-revert claims with claims about the adversarial review model
2. Or implement the commit-or-revert gate if it's still desired

## Status

Open — requires human action (elves cannot modify invariants.md).
