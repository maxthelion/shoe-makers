skill-type: doc-sync

# Write finding for unspecified partial-work / continue-work action

## Wiki Spec

Invariants section 2.2 lists reactive conditions but does not mention `partial-work`. Section 3.1 mentions partial work only in passing ("Partial work is fine: agent writes what it has, exits, next tick picks up from there") without describing the mechanism.

## Current Code

- `src/tree/default-tree.ts`: `partial-work` condition checks for `.shoe-makers/state/partial-work.md` and routes to `continue-work`
- `src/verify/permissions.ts`: `continue-work` has same broad permissions as `execute-work-item` (src/, wiki, .shoe-makers/state/, CHANGELOG.md, README.md)
- `src/prompts/continue-work.ts`: generates the continue-work prompt

## What to Build

Write a finding to `.shoe-makers/findings/unspecified-partial-work.md` documenting this unspecified feature for human review. Follow the format of existing findings.

## Tests to Write

None — this is a finding, not a code change.

## What NOT to Change

- Do NOT modify any source code
- Do NOT modify `.shoe-makers/invariants.md`

## Decision Rationale

Last remaining candidate from the explore list. Documents undocumented architectural behaviour for human spec update.
