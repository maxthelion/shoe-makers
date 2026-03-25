# Fix execute-work-item permissions row in verification.md

skill-type: doc-sync

## What to do

Update the `execute-work-item` row in the roles/permissions table in `wiki/pages/verification.md` to include the three missing writable paths.

## Current wiki text (line 27)

```
| execute-work-item | **executor** | `src/`, `wiki/`, `.shoe-makers/state/` | invariants |
```

## Code (source of truth)

From `src/verify/permissions.ts:60-64`:
```typescript
"execute-work-item": {
  role: "executor",
  canWrite: ["src/", wikiPath, ".shoe-makers/state/", ".shoe-makers/claim-evidence.yaml", "CHANGELOG.md", "README.md"],
  cannotWrite: [...ALWAYS_FORBIDDEN],
},
```

Three paths are missing from the wiki row: `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md`.

## Exact change

Replace line 27 in `wiki/pages/verification.md`:

**Old:**
```
| execute-work-item | **executor** | `src/`, `wiki/`, `.shoe-makers/state/` | invariants |
```

**New:**
```
| execute-work-item | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md` | invariants |
```

## What NOT to change

- Do NOT modify `src/verify/permissions.ts` — the code is correct
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any test files
- Do NOT change any other rows in the table
- Do NOT change any other sections of verification.md

## Decision Rationale

Chosen over candidates 2 and 3 because:
- It closes a documented spec-code gap (noted in critique-2026-03-25-228)
- Same type as the successful continue-work fix — low risk, high value
- Test coverage candidates (2, 3) add safety nets but don't close spec gaps
