# Candidates

## 1. Add test evidence for "system can be interrupted" invariant
**Type**: test
**skill-type**: test
**Impact**: high
**Reasoning**: The invariant "The system can be interrupted at any point and resume correctly next tick" is specified-only. The evidence rules in `claim-evidence.yaml` require `readWorldState` in tests. While `readWorldState` appears in `src/__tests__/world.test.ts`, the evidence pattern may not be matching correctly. The fix is either to add a test that explicitly verifies interrupt-and-resume behaviour (e.g., killing a tick mid-execution and verifying next tick recovers), or to fix the evidence pattern to match the existing test. File: `src/__tests__/world.test.ts` or `.shoe-makers/claim-evidence.yaml`.

## 2. Add test evidence for "no task tracking/locks/leases" invariant
**Type**: test
**skill-type**: test
**Impact**: high
**Reasoning**: The invariant "No task tracking, no locks, no leases" is specified-only. The evidence rule requires `evaluate(` in tests. This pattern definitely exists in `src/__tests__/evaluate.test.ts`. The issue may be that the evidence checker has a bug or the claim ID in `claim-evidence.yaml` doesn't match the extracted claim ID from the wiki. Debugging the evidence matcher for this specific claim would close the gap. File: `.shoe-makers/claim-evidence.yaml`.

## 3. Improve evidence pattern matching diagnostics
**Type**: improve
**skill-type**: implement
**Impact**: medium
**Reasoning**: When invariant evidence rules exist but don't match, there's no visibility into why. Adding a `--verbose` or debug mode to the invariant checker that shows which patterns were searched and what they matched against would help diagnose and fix evidence gaps faster. File: `src/verify/invariants.ts`.
