# Candidates

## 1. Fix hardcoded wiki script path in package.json
**Type**: bug-fix
**Impact**: medium
**Reasoning**: `package.json` line 6 has `bun run /Users/maxwilliams/dev/octowiki/src/index.ts` — a hardcoded path to the developer's local machine. This breaks `bun run wiki` on any other system. The script should resolve octowiki from node_modules or use an environment variable. Since octowiki is listed in the README as a dependency but not in package.json, the fix may need to add it as a dependency or document the setup requirement. This affects developer experience on fresh clones.

## 2. Add isFileAllowed test for .shoe-makers/config.yaml permission
**Type**: test
**Impact**: low
**Reasoning**: The permission fix that added `.shoe-makers/config.yaml` to the executor's canWrite list (`src/verify/permissions.ts` line 62) has no explicit test. While the existing permission tests cover the pattern, adding a specific test for config.yaml would prevent regression if someone later refactors the permissions table. Quick one-line test addition to `src/__tests__/permissions.test.ts`.

## 3. Document octowiki setup in README getting started section
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README line 98 mentions `bun run wiki` as a way to start octowiki, but doesn't explain how to install octowiki. The wiki script currently fails on fresh clones. Adding a brief note about octowiki setup (clone it, set OCTOWIKI_PATH, or install it) would help new contributors. Small documentation improvement.
