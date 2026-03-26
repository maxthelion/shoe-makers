skill-type: bug-fix

# Fix hardcoded wiki script path in package.json

## Wiki Spec

From `README.md` line 98: `bun run wiki` should start octowiki on port 4570.
From `CLAUDE.md`: "Wiki: OctoWiki (run with `bun run wiki`, serves on port 4570)"

## Current Code

`package.json` line 6:
```json
"wiki": "OCTOWIKI_DIR=$PWD/wiki PORT=4570 bun run /Users/maxwilliams/dev/octowiki/src/index.ts"
```

This is a hardcoded absolute path to the developer's local machine. It fails on any other system.

OctoWiki is available at `github:maxthelion/octowiki` (same pattern as octoclean at line 25 of package.json).

## What to Build

1. Add `octowiki` as a dependency in `package.json`: `"octowiki": "github:maxthelion/octowiki"`
2. Update the wiki script to use the installed path: `"wiki": "OCTOWIKI_DIR=$PWD/wiki PORT=4570 bun run node_modules/octowiki/src/index.ts"`
3. Run `bun install` to update the lock file
4. Run `bun test` to confirm nothing breaks

## Patterns to Follow

Follow the same pattern as octoclean (`"octoclean": "github:maxthelion/octoclean"` in dependencies). The health-scan module references octoclean via `node_modules/octoclean/src/cli/index.ts`.

## Tests to Write

No tests needed — this is a configuration fix. The wiki script is an external tool, not tested in the test suite.

## What NOT to Change

- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any source files except `package.json`
- Do NOT modify bun.lock manually (let `bun install` update it)

## Decision Rationale

Candidate #1 chosen because it fixes a real bug that breaks the wiki on fresh clones. The other candidates (permissions test, docs) are lower impact.
