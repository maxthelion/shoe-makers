---
title: Verification
category: architecture
tags: [verification, qa, gatekeeper, adversarial, permissions, tdd]
summary: How agent work gets reviewed — role-based permissions, cross-elf gatekeeping, and TDD enforcement.
last-modified-by: user
---

## Principle

Verification is not self-review. The executor and verifier must be different elves with different prompts and different permissions. An elf that writes code should not be the one that reviews it.

## Roles and Permissions

Each action from the [[behaviour-tree]] has a **role** that determines what the elf is allowed to touch. The elf's prompt includes both the task and the permission boundary.

| Tree condition | Role | Can write | Cannot write |
|---|---|---|---|
| Unresolved critiques? | **Fixer** | `src/` (scoped to flagged files) | tests, invariants, wiki |
| Unreviewed commits? | **Reviewer** | `.shoe-makers/findings/` only | `src/`, tests, wiki, invariants |
| Tests failing? | **Test fixer** | `src/` (scoped to failing tests) | invariants, wiki |
| Specified-only invariant? | **Implementer** | tests first, then `src/` | invariants, wiki |
| Untested code? | **Test writer** | `src/__tests__/` only | `src/` (non-test), invariants |
| Undocumented code? | **Doc writer** | `wiki/pages/` only | `src/`, tests, invariants |
| Code health? | **Refactorer** | `src/` (scoped to worst files) | tests, invariants, wiki |
| Explore? | **Assessor** | `.shoe-makers/state/`, findings | `src/`, tests, wiki |
| Open plans? | **Plan implementer** | tests first, then `src/`, wiki | invariants |
| Inbox? | **Inbox handler** | varies by message | — |

Key constraints:
- **Invariants are never writable by elves.** Only humans maintain `.shoe-makers/invariants.md`. This prevents the cheating problem where elves tailor claims to match their code.
- **Reviewers can only write findings.** They can't "fix" problems they find — they document them for the next elf.
- **Implementers write tests first.** TDD is enforced by the permission model: write tests, commit, then next tick the "tests failing" condition fires and the elf can write implementation code.

## TDD Enforcement

The permission model naturally enforces test-driven development:

1. "Specified-only invariant?" fires → elf gets **test writer** instructions: "write tests for this spec claim, but do NOT implement it yet"
2. Elf writes tests, they fail, commits
3. Next tick: "tests failing?" fires → elf gets **test fixer** instructions: "make these tests pass by implementing the feature"
4. Elf implements, tests pass, commits
5. Next tick: "unreviewed commits?" fires → different elf reviews the work

Each step is a different tick with a different prompt and different permissions. The elf writing the implementation can't change the tests it's trying to satisfy.

## Cross-Elf Gatekeeping

### How it works

1. Each action's rules are saved to `.shoe-makers/state/last-action.md` before the next action overwrites it
2. When the elf commits, the commit hash is tracked
3. `.shoe-makers/state/last-reviewed-commit` records the last commit that was reviewed
4. The tree condition "unreviewed commits?" checks if HEAD is ahead of `last-reviewed-commit`
5. When it matches, the reviewer elf gets:
   - The diff since last review
   - The rules the previous elf was given (from `last-action.md`)
   - Instructions to check: did they stay in scope? Did they game anything? Is the code correct?

### What the reviewer checks

- **Scope violation**: did the elf touch files outside its allowed list?
- **Test quality**: do the tests actually verify the claimed behaviour, or are they trivial?
- **Invariant gaming**: did the elf modify evidence patterns to make claims pass without real implementation?
- **Spec alignment**: does the change match what the wiki describes?
- **Regressions**: does the change break existing behaviour?

### Critique findings

Critiques are written to `.shoe-makers/findings/critique-YYYY-MM-DD-NNN.md` with:
- What was reviewed (commit range)
- What problems were found
- Severity: blocking (must fix before new work) or advisory (should fix eventually)

### Resolution

The tree condition "unresolved critiques?" sits near the top — above plans and features. Blocking critiques must be resolved before new work happens. The fixer elf reads the critique, makes the fix, commits. The next reviewer checks the fix.

## The Review Prompt

The reviewer gets a focused prompt:

```
You are reviewing the work of a previous elf. You did NOT write this code.

## Rules the previous elf was given
[contents of last-action.md]

## Commits to review
[git diff since last-reviewed-commit]

## Your job
1. Did the elf stay within its permitted files?
2. Does the code correctly implement what was asked?
3. Do the tests actually verify the behaviour, or are they trivial?
4. Were any invariants or evidence patterns modified to game the system?
5. Does the change match the wiki spec?

Write your findings to .shoe-makers/findings/. Be adversarial — assume the work may be wrong.
You may ONLY write to .shoe-makers/findings/. Do not modify any code.
```

## Tree Order

```
Selector
├── [tests failing?] → Fix them
├── [unresolved critiques?] → Fix the flagged issues
├── [unreviewed commits?] → Review adversarially
├── [inbox messages?] → Read and act
├── [open plans?] → Write tests first, then implement
├── [specified-only invariants?] → Write tests first, then implement
├── [untested code?] → Write tests only
├── [undocumented code?] → Update wiki only
├── [code health below threshold?] → Refactor scoped files
├── [nothing?] → Explore
```

Critiques sit above unreviewed work — you fix problems before reviewing new work. Unreviewed work sits above new work — you review before starting something new.

See also: [[behaviour-tree]], [[observability]], [[invariants]], [[pure-function-agents]]
