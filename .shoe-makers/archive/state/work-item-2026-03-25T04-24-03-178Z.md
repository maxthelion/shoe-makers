# Doc-sync: Update role-permission table in verification.md

skill-type: doc-sync

## What to fix

The permission table in `wiki/pages/verification.md` lines 19-31 describes roles that don't match the code in `src/verify/permissions.ts` lines 26-82.

## Current wiki table (lines 19-31)

```
| Tree condition / work type | Role | Can write | Cannot write |
|---|---|---|---|
| Tests failing? | **test-fixer** | `src/` | invariants, wiki |
| Unresolved critiques? | **critique-fixer** | `src/`, `.shoe-makers/findings/` | invariants, wiki |
| Unreviewed commits? | **reviewer** | `.shoe-makers/findings/` only | `src/`, tests, wiki, invariants |
| Uncommitted work? | **reviewer** | `.shoe-makers/findings/` only | `src/`, tests, wiki, invariants |
| Inbox? | **inbox-handler** | `src/`, `wiki/`, `.shoe-makers/` | invariants |
| Open plans? | **plan-implementer** | `src/`, `wiki/` | `src/__tests__/`, invariants |
| Specified-only invariant? | **implementer** | `src/` | `src/__tests__/`, wiki, invariants |
| Untested code? | **test-writer** | `src/__tests__/` only | `src/` (non-test), invariants, wiki |
| Undocumented code? | **doc-writer** | `wiki/` only | `src/`, tests, invariants |
| Code health? | **refactorer** | `src/` | `src/__tests__/`, wiki, invariants |
| Explore? | **assessor** | `.shoe-makers/findings/` only | `src/`, tests, wiki, invariants |
```

## Current code roles (from `src/verify/permissions.ts`)

```typescript
"fix-tests":         { role: "test-fixer",         canWrite: ["src/"],                                cannotWrite: ["invariants", "wiki/"] }
"fix-critique":      { role: "critique-fixer",      canWrite: ["src/", ".shoe-makers/findings/"],      cannotWrite: ["invariants", "wiki/"] }
"critique":          { role: "reviewer",            canWrite: [".shoe-makers/findings/"],               cannotWrite: ["invariants", "src/", "wiki/"] }
"review":            { role: "reviewer",            canWrite: [".shoe-makers/findings/"],               cannotWrite: ["invariants", "src/", "wiki/"] }
"inbox":             { role: "inbox-handler",       canWrite: ["src/", "wiki/", ".shoe-makers/"],      cannotWrite: ["invariants"] }
"execute-work-item": { role: "executor",            canWrite: ["src/", "wiki/", ".shoe-makers/state/", etc.], cannotWrite: ["invariants"] }
"dead-code":         { role: "dead-code-remover",   canWrite: ["src/"],                                cannotWrite: ["invariants", "wiki/"] }
"prioritise":        { role: "prioritiser",         canWrite: [".shoe-makers/state/"],                 cannotWrite: ["invariants", "src/", "wiki/"] }
"innovate":          { role: "innovator",           canWrite: [".shoe-makers/insights/"],              cannotWrite: ["invariants", "src/", "wiki/"] }
"evaluate-insight":  { role: "insight-evaluator",   canWrite: [".shoe-makers/insights/", ".shoe-makers/state/", ".shoe-makers/log/"], cannotWrite: ["invariants", "src/", "wiki/"] }
"explore":           { role: "explorer",            canWrite: [".shoe-makers/state/", ".shoe-makers/findings/"], cannotWrite: ["invariants", "src/", "wiki/"] }
```

## What to change

Replace lines 19-31 of `wiki/pages/verification.md` with a table that matches the code. The new table should:

1. Show the **actual action types** from the code, not the old work-type conditions
2. Match the **actual role names** from `src/verify/permissions.ts`
3. Match the **actual canWrite/cannotWrite** from the code
4. Group into "reactive" (tree conditions) and "three-phase" (orchestration) sections

Proposed replacement table:

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

Also update the introductory text on line 17. Current:
```
The reactive conditions (tests failing, critiques, reviews, uncommitted work, inbox) appear directly in the tree. The remaining rows (open plans, specified-only invariants, untested code, undocumented code, code health) describe roles applied when executing work items through the three-phase orchestration cycle.
```

Replace with:
```
The reactive conditions (tests failing, critiques, reviews, uncommitted work, inbox) appear directly in the tree. The remaining actions (execute-work-item, dead-code, prioritise, innovate, evaluate-insight, explore) are part of the three-phase orchestration cycle.
```

Also update "Key constraints" line 36. Current:
```
- **Implementers write tests first.** TDD is enforced by the permission model: write tests, commit, then next tick the "tests failing" condition fires and the elf can write implementation code.
```

Replace with:
```
- **Executors have broad permissions.** The `execute-work-item` role can write both source and tests because it handles varied skill types. The skill prompt determines what should be changed.
```

Update `last-modified-by` to `elf`.

## Tests

No new tests needed — wiki-only change. Run `bun test` to confirm.

## What NOT to change

- Do NOT modify `src/verify/permissions.ts` or any code files
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT restructure the rest of verification.md — only update the permission table and its surrounding text
- Keep the existing section headers and structure intact

## Decision Rationale

Candidate 1 (verification table desync) was chosen because:
1. The permission table is the primary reference for what elves can and cannot do — an inaccurate table actively misleads
2. It's the highest-impact remaining doc-sync issue
3. Candidates 2 and 3 are low priority (indirect test coverage is adequate, wiki fetch logging is minor)
