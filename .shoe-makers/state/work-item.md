# Archive resolved findings automatically in assessment

skill-type: implement

## Context

Resolved critique files accumulate in `.shoe-makers/findings/` and inflate the assessment findings count. Previous elves manually archive them (e.g. commit `9ea028d` — "Archive resolved critiques 092-094"). This should be automatic.

Currently there are 5 resolved critique files in `findings/` that should be in `findings/archive/`.

## What to build

Add an `archiveResolvedFindings()` function to `src/skills/assess.ts` (or a new file if assess.ts is getting too large) that:

1. Reads all `.md` files in `.shoe-makers/findings/`
2. For each file whose content matches the resolved pattern (`/^## Status\s*\n\s*Resolved\.?\s*$/mi`)
3. Moves it to `.shoe-makers/findings/archive/` (using `rename()` from `node:fs/promises`)
4. Returns the list of archived file names (for logging)

Call this function from `src/setup.ts` during the setup flow, **before** the assessment runs. This way the assessment only counts truly open findings.

## Relevant code

- `src/skills/assess.ts:80-99` — `readFindings()` reads all `.md` files from `findings/` root. Already skips `archive/` because `readdir` doesn't recurse.
- `src/state/world.ts:96-110` — `countUnresolvedCritiques()` already has the `RESOLVED_PATTERN` regex. Reuse or import it.
- `src/setup.ts` — the setup entry point where archiving should be called.

## Pattern to follow

The `RESOLVED_PATTERN` regex in `src/state/world.ts` is: `/^## Status\s*\n\s*Resolved\.?\s*$/mi`

Import or duplicate this pattern. The archiving is a simple file move — no git operations needed since setup.ts runs before the elf starts working.

## Tests to write

In `src/__tests__/` (new file `archive.test.ts` or added to an existing test file):

1. Test that a file matching the resolved pattern gets moved to `archive/`
2. Test that a file NOT matching the pattern stays in place
3. Test that the function handles an empty findings directory gracefully
4. Test that the function creates the `archive/` directory if it doesn't exist

Use `tmp` directories for test isolation — don't touch the real findings directory.

## What NOT to change

- Don't modify `readFindings()` — it already correctly reads only the root directory
- Don't modify `countUnresolvedCritiques()` — it already filters by resolved status
- Don't change the behaviour tree or tree conditions
- Don't modify any existing findings files by hand — let the new function do the work
- Don't add git operations (add/commit) — the setup script handles that separately
