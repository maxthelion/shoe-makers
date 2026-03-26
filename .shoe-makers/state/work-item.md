skill-type: doc-sync

# Sync wiki verification permissions table with code

## Wiki Spec

`wiki/pages/verification.md` lines 19-32 define a permissions table mapping each action to its role and allowed/forbidden file paths. This table is the source of truth that reviewers use to check elf compliance (line 79: "Automated: setup.ts pre-computes permission violations using checkPermissionViolations()").

## Current Code

`src/verify/permissions.ts` implements the actual permission boundaries. Two actions have broader permissions in code than the wiki documents:

1. **`continue-work`** (line 47): code allows `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml` — wiki line 26 omits these
2. **`execute-work-item`** (line 62): code allows `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/config.yaml`, `package.json`, `bun.lock`, `bun.lockb` — wiki line 27 omits these

The code permissions are intentional — executors need to write shift logs, archive consumed state, and update dependencies. The wiki table just hasn't kept up.

## What to Build

Update the wiki permissions table at `wiki/pages/verification.md` lines 26-27 to match the code:

1. Change line 26 (`continue-work`) from:
   ```
   | continue-work | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md` | invariants |
   ```
   to:
   ```
   | continue-work | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/claim-evidence.yaml`, `.shoe-makers/config.yaml`, `CHANGELOG.md`, `README.md` | invariants |
   ```

2. Change line 27 (`execute-work-item`) from:
   ```
   | execute-work-item | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/claim-evidence.yaml`, `CHANGELOG.md`, `README.md` | invariants |
   ```
   to:
   ```
   | execute-work-item | **executor** | `src/`, `wiki/`, `.shoe-makers/state/`, `.shoe-makers/log/`, `.shoe-makers/archive/`, `.shoe-makers/claim-evidence.yaml`, `.shoe-makers/config.yaml`, `CHANGELOG.md`, `README.md`, `package.json`, `bun.lock`, `bun.lockb` | invariants |
   ```

## Patterns to Follow

- Keep the markdown table format consistent with existing rows
- Use backtick-wrapped paths as in the existing table cells
- Maintain alphabetical-ish order within the canWrite list (match the code's ordering)

## Tests to Write

No new tests needed — this is a wiki-only change. Run `bun test` to confirm no tests break (the permissions tests in `src/__tests__/permissions.test.ts` test the code, not the wiki).

## What NOT to Change

- Do NOT modify `src/verify/permissions.ts` — the code is correct, the wiki needs to catch up
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change any other wiki pages
- Do NOT change any other rows in the table — only lines 26 and 27

## Decision Rationale

Candidate #1 (DRY consolidation) was just completed this tick. Candidate #2 (doc-sync) is next highest impact: the permissions table mismatch means reviewers checking against the wiki will flag legitimate executor writes to log/archive/config as violations. This creates false positives in adversarial review and wastes review cycles. Candidate #3 (buildWorldState tests) is lower priority since the system is healthy at 99/100.
