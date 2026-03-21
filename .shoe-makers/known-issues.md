# Known Issues

Read this if you encounter problems. These are issues previous elves have hit.

## Branch checkout creates a new branch instead of using existing remote

**Symptom**: `bun run setup` creates a fresh branch from main instead of checking out the existing remote shoemakers branch. Your push then fails or requires a force push.

**Cause**: `git checkout -b shoemakers/YYYY-MM-DD` runs before `origin/shoemakers/YYYY-MM-DD` is fetched, or the checkout falls through to creating from HEAD.

**Fix**: Run `git fetch origin` first. Then `git checkout shoemakers/YYYY-MM-DD` (without `-b`). If that fails, `git checkout -b shoemakers/YYYY-MM-DD origin/shoemakers/YYYY-MM-DD`.

**NEVER force push to fix this.** If you've committed to the wrong branch, cherry-pick your commits onto the correct one.

## Tests fail with "your current branch 'main' does not have any commits yet"

**Symptom**: Some tests that run git commands fail with this error.

**Cause**: Tests create temporary repos with `git init` but some git versions require an initial commit. These are environment-specific failures — not real test failures.

**Fix**: Ignore these. They pass in the cloud environment.

## Health scan tests fail locally

**Symptom**: `health-scan` tests fail with errors about octoclean or lizard not being installed.

**Cause**: Octoclean requires Python's `lizard` package for complexity analysis. Not installed locally.

**Fix**: These are environment-specific. The health scan gracefully returns null when octoclean isn't available.
