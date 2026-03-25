---
title: Verification
category: architecture
tags: [verification, qa, gatekeeper, adversarial, permissions, tdd]
summary: How agent work gets reviewed — role-based permissions, cross-elf gatekeeping, and TDD enforcement.
last-modified-by: elf
---

## Principle

Verification is not self-review. The executor and verifier must be different elves with different prompts and different permissions. An elf that writes code should not be the one that reviews it.

## Roles and Permissions

Each action from the [[behaviour-tree]] has a **role** that determines what the elf is allowed to touch. The elf's prompt includes both the task and the permission boundary.

The reactive conditions (tests failing, critiques, reviews, uncommitted work, inbox) appear directly in the tree. The remaining actions (execute-work-item, dead-code, prioritise, innovate, evaluate-insight, explore) are part of the three-phase orchestration cycle.

| Action | Role | Can write | Cannot write |
|---|---|---|---|
| fix-tests | **test-fixer** | `src/` | invariants, wiki |
| fix-critique | **critique-fixer** | `src/`, `.shoe-makers/findings/` | invariants, wiki |
| critique | **reviewer** | `.shoe-makers/findings/` only | `src/`, wiki, invariants |
| review | **reviewer** | `.shoe-makers/findings/` only | `src/`, wiki, invariants |
| inbox | **inbox-handler** | `src/`, `wiki/`, `.shoe-makers/` | invariants |
| execute-work-item | **executor** | `src/`, `wiki/`, `.shoe-makers/state/` | invariants |
| dead-code | **dead-code-remover** | `src/` | invariants, wiki |
| prioritise | **prioritiser** | `.shoe-makers/state/` only | `src/`, wiki, invariants |
| innovate | **innovator** | `.shoe-makers/insights/` only | `src/`, wiki, invariants |
| evaluate-insight | **insight-evaluator** | `.shoe-makers/insights/`, `.shoe-makers/state/`, `.shoe-makers/log/` | `src/`, wiki, invariants |
| explore | **explorer** | `.shoe-makers/state/`, `.shoe-makers/findings/` | `src/`, wiki, invariants |

Key constraints:
- **Invariants are never writable by elves.** Only humans maintain `.shoe-makers/invariants.md`. This prevents the cheating problem where elves tailor claims to match their code.
- **Reviewers can only write findings.** They can't "fix" problems they find — they document them for the next elf.
- **Executors have broad permissions.** The `execute-work-item` role can write both source and tests because it handles varied skill types. The skill prompt determines what should be changed.

## TDD Enforcement

The permission model enforces separation of concerns:

- **Executors** (`execute-work-item`) can write both source and test files — the executor role is broadly permissioned to support varied skill types
- **Test fixers** (`fix-tests`) can write both source and tests (fixing requires both)

In practice, the `execute-work-item` action handles all implementation, testing, and documentation work. The executor role is broadly permissioned because the skill prompt (loaded from `.shoe-makers/skills/`) determines the scope of work. Permission boundaries in the table above apply to work items via their skill type.

The ideal two-tick TDD cycle — where one elf writes failing tests and a different elf implements — is supported by the permission model but not strictly enforced by the tree routing.

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

### Orchestration skip

Not all commits need adversarial review. Commits that only touch orchestration output directories are automatically skipped:

- `.shoe-makers/state/` — orchestration state files (candidates.md, work-item.md)
- `.shoe-makers/findings/` — critique findings
- `.shoe-makers/insights/` — creative insights
- `.shoe-makers/log/` — shift log entries
- `.shoe-makers/archive/` — archived files

These are mechanical outputs of the tree cycle, not code changes. Skipping review for them prevents the system from spending most of its shift reviewing low-risk orchestration artifacts.

Commits that touch `src/`, `wiki/`, or any real code still trigger full adversarial review.

### What the reviewer checks

- **Scope violation**: did the elf touch files outside its allowed list? (Automated: `setup.ts` pre-computes permission violations using `checkPermissionViolations()` and includes them as a warning in the critique prompt. The reviewer should still verify manually — automated detection supplements but doesn't replace judgment.)
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

Note: When permission violations are detected, the prompt includes a `PERMISSION VIOLATIONS DETECTED` warning listing the specific files that were modified outside the elf's permitted scope.

## Tree Order

```
Selector
├── [tests failing?] → Fix them
├── [review loop ≥3?] → Break out to explore
├── [unresolved critiques?] → Fix the flagged issues
├── [unreviewed commits?] → Review adversarially (critique)
├── [uncommitted work?] → Review before committing (review)
├── [inbox messages?] → Read and act
├── [dead-code work-item?] → Remove dead code
├── [work-item.md exists?] → Execute the work item
├── [candidates.md exists?] → Prioritise: pick one, write work-item.md
├── [insights exist?] → Evaluate insight
├── [innovation tier?] → Innovate: write insight from creative brief
└── [always] → Explore: write candidates.md
```

The review-loop circuit breaker prevents infinite critique/fix-critique cycles. If the shift has seen 3+ review loop iterations (detected via the shift log parser), the tree routes to explore instead of continuing the loop. This ensures the shift makes progress even when a critique can't be resolved.

Critiques sit above unreviewed work — you fix problems before reviewing new work. Unreviewed work sits above new work — you review before starting something new.

Note: The `review` node (uncommitted work) is separate from `critique` (unreviewed commits). Both use the reviewer role but trigger at different points.

The conditions removed from the earlier version of this tree (open plans, specified-only invariants, untested code, undocumented code, code health) are handled through the three-phase orchestration cycle: explore surfaces them as candidates, prioritise picks one, and execute-work-item performs it. The roles and permissions in the table above still apply — the execute-work-item action uses the appropriate role based on the type of work being performed.

See also: [[behaviour-tree]], [[observability]], [[invariants]], [[pure-function-agents]]
