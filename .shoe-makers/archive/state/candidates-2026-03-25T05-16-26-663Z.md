# Candidates

## 1. Fix README inaccuracies: missing config options and directory structure
**Type**: doc-sync
**Impact**: high
**Reasoning**: The README is missing several config options that `src/config/load-config.ts` supports: `max-ticks-per-shift` (default 10), `enabled-skills`, and `max-innovation-cycles` (default 3). The `.shoe-makers/` directory structure in the README omits `insights/`, `archive/`, and `claim-evidence.yaml`. These are all implemented and actively used. Users following the README would miss important configuration knobs and might delete `claim-evidence.yaml` thinking it's stale. Wiki page `wiki/pages/bootstrapping.md` specifies the project structure. Affects invariant 1.1 ("minimal configuration" / "sensible defaults for everything").

## 2. Fix hardcoded path in package.json wiki script
**Type**: bug-fix
**Impact**: medium
**Reasoning**: The `wiki` script in `package.json` line 6 has a hardcoded absolute path: `/Users/maxwilliams/dev/octowiki/src/index.ts`. This only works on the original developer's machine. Since `octoclean` is listed as a dependency (`"octoclean": "github:maxthelion/octoclean"`), the wiki tool should similarly be referenced via a dependency or documented as requiring local setup. This is a portability bug — any new user or CI environment running `bun run wiki` will get a file-not-found error. The fix should either add octowiki as a dependency or update the script to reference a local/installed path, or at minimum document the requirement in README.

## 3. Add tests for utils/fs.ts fileExists function
**Type**: test-coverage
**Impact**: low
**Reasoning**: `src/utils/fs.ts` exports `fileExists()` — a 14 LOC function wrapping `fs/promises.access()` with error handling. It's used by `src/init.ts` and `src/state/world.ts`. It has no direct test coverage. While simple, the error handling path (catching non-ENOENT errors) is untested. Low impact because the function is thin, but it's the only source file with real logic that has zero test coverage. All other source files either have tests or are pure type definitions / entry point scripts.
