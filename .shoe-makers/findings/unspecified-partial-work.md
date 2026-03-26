# Unspecified partial-work / continue-work action

## Observation

The behaviour tree includes a `partial-work` reactive condition and `continue-work` action that are not described in the invariants or wiki.

### Tree node

`src/tree/default-tree.ts` defines a `partial-work` condition that checks for `.shoe-makers/state/partial-work.md`. When this file exists, the tree routes to the `continue-work` action before checking for unreviewed commits or the three-phase cycle.

### Permissions

`src/verify/permissions.ts` grants `continue-work` the same broad file permissions as `execute-work-item`:
- `src/**` (source code)
- `wiki/**` (spec pages)
- `.shoe-makers/state/` (state files)
- `CHANGELOG.md`, `README.md`

This is the broadest permission set in the system — broader than critique, review, or explore.

### Prompt

`src/prompts/continue-work.ts` generates the continue-work prompt, instructing the elf to read the partial-work file and resume where the previous elf left off.

### Spec mentions

Invariants section 3.1 mentions partial work in passing: "Partial work is fine: agent writes what it has, exits, next tick picks up from there." This describes the concept but not the mechanism (the `partial-work.md` file, the `continue-work` action, or its permissions).

Section 2.2 (reactive conditions) does not list `partial-work` among the reactive tree nodes.

## Why it matters

- The `partial-work` mechanism allows any elf to leave a `partial-work.md` file that triggers a continuation action with execute-level permissions
- Since this continuation happens as a reactive condition (before the three-phase cycle), it could pre-empt normal work prioritisation
- The broad permission set for `continue-work` means the continuation elf has write access to all source code and wiki pages
- Without spec coverage, the purpose and boundaries of this feature are unclear to humans maintaining the system

## Recommendation

Human should:
1. Add `partial-work` to the reactive conditions list in section 2.2
2. Document the `partial-work.md` file format and lifecycle in section 3.1 or a new subsection
3. Consider whether `continue-work` should have the same permissions as `execute-work-item`, or a more restricted set
4. Document when elves are expected to write `partial-work.md` vs. simply exiting

## Status

Open — requires human action (elves cannot modify invariants.md).
