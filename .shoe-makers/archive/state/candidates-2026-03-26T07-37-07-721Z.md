# Candidates

## 1. Create default .shoe-makers/config.yaml template
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The wiki spec (`wiki/pages/creative-exploration.md` lines 29, 44) references `.shoe-makers/config.yaml` for `insight-frequency` and other tuning parameters. The config loader (`src/config/load-config.ts`) defines defaults for `insightFrequency` (0.3), `maxInnovationCycles` (3), `maxTicksPerShift` (10), and `enabledSkills` (all), but no config.yaml file exists in the repository. Users/operators cannot discover or tune these parameters without reading source code. Creating a commented template makes the system configurable as the README and spec promise.

## 2. Fix hardcoded development path in package.json wiki script
**Type**: bug-fix
**Impact**: medium
**Reasoning**: `package.json` line 6 has `"wiki": "OCTOWIKI_DIR=$PWD/wiki PORT=4570 bun run /Users/maxwilliams/dev/octowiki/src/index.ts"` — an absolute path to the developer's local machine. This breaks `bun run wiki` on any other system. Since octowiki is already listed as a dependency (`octoclean@github:maxthelion/octoclean`), the script should reference the installed package path rather than a hardcoded dev path. Quick fix with broad usability impact.

## 3. Pin TypeScript version in devDependencies
**Type**: dependency-update
**Impact**: low
**Reasoning**: `package.json` has `"typescript": "^5 || ^6"` as a peer dependency but no pinned version in devDependencies. TypeScript 5.9.3 is installed and typechecks cleanly. Without a pin, different environments may get different TypeScript versions, potentially causing CI/local divergence. A low-risk improvement to make builds reproducible.
