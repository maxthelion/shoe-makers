skill-type: dependency-update

# Update TypeScript peer dependency to support v6

## Wiki Spec

No wiki page specifies the TypeScript version. `wiki/pages/architecture.md` mentions TypeScript as the language. The CLAUDE.md says "Language: TypeScript".

## Current Code

`package.json` specifies:
```json
"peerDependencies": {
  "typescript": "^5"
}
```

`bun outdated` shows TypeScript 6.0.2 is available (current: 5.9.3).

The `tsconfig.json` or TypeScript configuration may need review for v6 compatibility.

## What to Build

1. Update `package.json` peerDependencies to `"typescript": "^5 || ^6"` to allow both v5 and v6
2. Run `bun install` to ensure the lockfile is updated
3. Run `bun run typecheck` to verify type-checking still passes with the current TypeScript version
4. Run `bun test` to verify all tests pass
5. If typecheck or tests fail with the constraint change, investigate and fix

Note: This does NOT upgrade the installed TypeScript version — it only broadens the peer dependency constraint. The actual installed version stays at 5.9.3 unless `bun update typescript` is run separately.

## Patterns to Follow

- Keep the change minimal — only modify the peerDependencies constraint
- Don't upgrade the actual installed version in this work item (that's a separate, riskier step)

## Tests to Write

No new tests needed. Run existing tests to verify nothing breaks: `bun test` and `bun run typecheck`.

## What NOT to Change

- Do NOT modify any source code
- Do NOT modify tsconfig.json
- Do NOT upgrade the actual installed TypeScript version (only broaden the constraint)
- Do NOT modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #1 (README sync) was already completed in the previous execute cycle. Of the remaining candidates: #3 (scheduled-tasks.md) was investigated and found to be accurate — no finding needed. #4 (prompt tests) would add marginal value since 6 prompt test files already exist with comprehensive coverage. #5 (duplicate archives) is trivial. #2 (TypeScript constraint) is the most concrete remaining improvement — broadening the peer dependency prevents install warnings for projects using TS v6.
