# Update verification.md to Document Automated Permission Enforcement

skill-type: doc-sync

## Context

We just wired `checkPermissionViolations()` into the critique prompt (commit 815c7c9). The wiki page `verification.md` describes the manual review process but doesn't mention the new automated detection.

From wiki `verification.md` (line 65):
> "**Scope violation**: did the elf touch files outside its allowed list?"

This is now partially automated — `setup.ts` detects violations and includes them as a warning in the critique prompt. The wiki should document this.

## What to change

Update `wiki/pages/verification.md` in the "What the reviewer checks" section to note that scope violations are now pre-computed and included in the prompt:

1. In the "What the reviewer checks" section (around line 64-69), add a note that scope violations are now automatically detected by `setup.ts` and surfaced as warnings in the critique prompt
2. Keep the manual check instruction — automated detection supplements but doesn't replace the reviewer's judgment
3. In the "The Review Prompt" section (around line 84-104), mention that the prompt may include a `PERMISSION VIOLATIONS DETECTED` warning when violations are found

## What NOT to change

- Do NOT modify the permission definitions or role table — those are correct
- Do NOT modify any source code
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT change the tree order or any other section unrelated to the automated detection
- Keep changes minimal — just document what was built

## Tests

No tests needed for wiki-only changes. Run `bun test` to confirm nothing breaks.
