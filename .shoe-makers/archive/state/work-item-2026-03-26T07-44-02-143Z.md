skill-type: doc-sync

# Create default .shoe-makers/config.yaml template

## Wiki Spec

From `wiki/pages/creative-exploration.md` line 29: "The `insight-frequency` is set in `.shoe-makers/config.yaml`."

From `README.md` lines 109-120: Shows a complete config.yaml example with all keys and their defaults.

From `src/config/load-config.ts` lines 18-27: The DEFAULTS object defines all configurable values.

## Current Code

`src/config/load-config.ts` defines 8 configurable parameters with defaults:
- `branch-prefix`: "shoemakers"
- `tick-interval`: 5
- `wiki-dir`: "wiki"
- `assessment-stale-after`: 30
- `max-ticks-per-shift`: 10
- `enabled-skills`: null (all enabled)
- `insight-frequency`: 0.3
- `max-innovation-cycles`: 3

But no `.shoe-makers/config.yaml` file exists in the repository.

## What to Build

Create `.shoe-makers/config.yaml` with all 8 documented parameters and their current defaults. Use comments to explain each parameter. Match the format shown in README.md lines 112-120.

The file should be committed (not gitignored) so it serves as both documentation and a template for overrides.

## Patterns to Follow

Match the README.md configuration section format. Use `#` comments for explanations. One parameter per line in `key: value` format.

## Tests to Write

No tests needed — this is a configuration file, not code. The config loader already handles this file format (tested in `src/__tests__/config.test.ts`).

## What NOT to Change

- Do NOT modify `src/config/load-config.ts` — defaults are correct
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any existing files — only create the new config.yaml

## Decision Rationale

Candidate #1 chosen because it addresses a spec-code inconsistency (wiki references a config file that doesn't exist) and improves usability (operators can discover and tune parameters without reading source code). Higher impact than the package.json script fix (#2) or TypeScript pin (#3) since it affects the core system behaviour.
