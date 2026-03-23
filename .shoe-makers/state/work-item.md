# Add src/utils/ to EXCLUDED_TOP_LEVEL

skill-type: health

## Context

`src/utils/` contains shared utility functions (currently just `fileExists()` in `fs.ts`). It's a generic utility directory, not an architectural feature that needs wiki specification. Similar to how `types.ts` and `index.ts` are excluded from unspecified detection, `utils` should be excluded too.

## What to do

1. Open `src/verify/invariants.ts` line 107-111
2. Add `"utils"` to the `EXCLUDED_TOP_LEVEL` set (it's a directory name, not a file)
3. Wait — `EXCLUDED_TOP_LEVEL` filters top-level entries from `sourceFiles.map(f => f.split("/")[0])`. For `utils/fs.ts`, `split("/")[0]` returns `"utils"`. So add `"utils"` to the set.
4. Run `bun test` to confirm all tests pass

## What NOT to change

- Do not modify wiki or `.shoe-makers/invariants.md`
- Do not modify test files
