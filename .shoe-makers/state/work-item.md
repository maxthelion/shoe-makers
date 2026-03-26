skill-type: doc-sync

# Sync wiki verification permissions table with code (log/ and archive/ paths)

## Wiki Spec

`wiki/pages/verification.md` lines 19-32 define the permissions table. Lines 26-27 show executor permissions:

```
| continue-work | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md` | invariants |
| execute-work-item | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md` | invariants |
```

These lines are missing `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml`, `package.json`, `bun.lock`, and `bun.lockb` — all of which are in the code's canWrite lists.

## Current Code

`src/verify/permissions.ts` lines 45-63 define the executor permissions:

- `continue-work` canWrite: `["src/", wikiPath, ".shoe-makers/state/", ".shoe-makers/log/", ".shoe-makers/archive/", ".shoe-makers/claim-evidence.yaml", ".shoe-makers/config.yaml", "CHANGELOG.md", "README.md"]`
- `execute-work-item` canWrite: `["src/", wikiPath, ".shoe-makers/state/", ".shoe-makers/log/", ".shoe-makers/archive/", ".shoe-makers/claim-evidence.yaml", ".shoe-makers/config.yaml", "CHANGELOG.md", "README.md", "package.json", "bun.lock", "bun.lockb"]`

## What to Build

Update the permissions table in `wiki/pages/verification.md` (lines 26-27) to match the code:

1. Change line 26 (`continue-work`) "Can write" column to: `` `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/claim-evidence.yaml`, `.shoe-makers/config.yaml`, `CHANGELOG.md`, `README.md` ``
2. Change line 27 (`execute-work-item`) "Can write" column to: `` `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/claim-evidence.yaml`, `.shoe-makers/config.yaml`, `CHANGELOG.md`, `README.md`, `package.json`, `bun.lock`, `bun.lockb` ``

Do NOT change any other rows in the table. Do NOT change the code in permissions.ts — the code is correct, the wiki needs to catch up.

## Patterns to Follow

- The wiki table uses backtick-wrapped paths with commas between them
- Each path ends with `/` for directories, no trailing slash for files
- The `last-modified-by: elf` frontmatter field should remain as-is

## Tests to Write

No tests needed — this is a documentation-only change. Run `bun test` to confirm nothing breaks (the wiki is read by the invariants pipeline).

## What NOT to Change

- Do NOT modify `src/verify/permissions.ts` — the code is already correct
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change any other wiki pages
- Do NOT change the "Cannot write" column or any other rows in the permissions table
- Do NOT change the prose below the table (lines 34-37) — the text about "broad permissions" still applies

## Decision Rationale

Candidate #1 was chosen because it closes a known spec-code gap identified in a recent critique (critique-2026-03-26-043). The wiki is the source of truth per the project's own spec (`wiki/pages/wiki-as-spec.md`), so a divergence between the wiki permissions table and the actual permissions code undermines the invariants pipeline. This is a small, low-risk change with clear before/after states. The other candidates (health improvements, test coverage) are lower priority since the system guidance says to prefer improvement work over tests when invariants are met.
