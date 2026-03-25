# Sync verification.md wiki page with continue-work action

skill-type: doc-sync

## What to do

Add the `continue-work` action to the roles/permissions table in `wiki/pages/verification.md`. This action exists in code but is missing from the wiki spec.

## The wiki text to update

In `wiki/pages/verification.md`, lines 19-31, the roles/permissions table currently lists 12 actions but omits `continue-work`:

```
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
```

## The code (source of truth for this change)

From `src/verify/permissions.ts:45-49`:
```typescript
"continue-work": {
  role: "executor",
  canWrite: ["src/", wikiPath, ".shoe-makers/state/", ".shoe-makers/claim-evidence.yaml", "CHANGELOG.md", "README.md"],
  cannotWrite: [...ALWAYS_FORBIDDEN],
},
```

From `src/tree/default-tree.ts:110`:
```typescript
makeConditionAction("partial-work", hasPartialWork, "continue-work"),
```

The condition fires when `partial-work.md` exists — it resumes incomplete work from a previous elf.

## Exact changes to make

1. In `wiki/pages/verification.md`, add a row to the permissions table after `inbox`:

```
| continue-work | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md` | invariants |
```

2. In the paragraph above the table (line 17), update the list of three-phase actions to include `continue-work`:

Current: "The remaining actions (execute-work-item, dead-code, prioritise, innovate, evaluate-insight, explore) are part of the three-phase orchestration cycle."

New: "The remaining actions (continue-work, execute-work-item, dead-code, prioritise, innovate, evaluate-insight, explore) are part of the three-phase orchestration cycle."

3. Also update `last-modified-by: elf` in the frontmatter (it's already `elf`, so no change needed if it stays that way).

## Patterns to follow

- Match the existing table format exactly (markdown pipes, bold role names, backtick paths)
- The `continue-work` row should follow the same "Can write / Cannot write" style as `execute-work-item` since they share the executor role
- Keep the table ordering logical: reactive actions first (fix-tests, fix-critique, critique, review, inbox, continue-work), then three-phase (execute-work-item, dead-code, prioritise, innovate, evaluate-insight, explore)

## What NOT to change

- Do NOT modify `src/verify/permissions.ts` — the code is correct
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any test files
- Do NOT change the structure or content of other sections in verification.md

## Decision Rationale

Candidate 1 was chosen over candidates 2-5 because:
- It closes a direct spec-code gap (the wiki is supposed to be the source of truth)
- Candidates 2 and 3 (test coverage) add safety nets but don't close invariant gaps
- Candidate 4 is human-only work (can't be done by an elf)
- Candidate 5 is speculative (creative lens, not grounded in current spec)
- Doc-sync work is low-risk, high-value: it prevents future permission confusion
