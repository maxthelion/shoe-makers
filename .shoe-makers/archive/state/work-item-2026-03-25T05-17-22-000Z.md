# Work Item: Sync README config section and project structure with actual implementation

skill-type: doc-sync

## What to change

### 1. Add missing config options to README (line 106-112)

The config.yaml example in the README is missing 3 options that `src/config/load-config.ts` supports. Update the YAML block at line 106-112 from:

```yaml
branch-prefix: shoemakers
tick-interval: 5
wiki-dir: wiki
assessment-stale-after: 30
insight-frequency: 0.3
```

To:

```yaml
branch-prefix: shoemakers
tick-interval: 5
wiki-dir: wiki
assessment-stale-after: 30
max-ticks-per-shift: 10
insight-frequency: 0.3
max-innovation-cycles: 3
# enabled-skills: implement,test-coverage,doc-sync  # default: all
```

These are the defaults from `src/config/load-config.ts:18-27`. The `enabled-skills` is `null` by default (meaning all skills enabled), so show it commented out.

### 2. Add missing directories to project structure (line 122-138)

The `.shoe-makers/` structure listing is missing two items. Add:
- `claim-evidence.yaml` after `invariants.md` — with comment `# Evidence patterns for invariant verification`
- `archive/` after `inbox/` — with comment `# Archived state and resolved findings`

The `insights/` directory is already listed (line 132). The `archive/` directory is used by `src/archive/state-archive.ts` and the `archiveResolvedFindings()` function in `src/skills/assess.ts`.

## Files to modify

- `README.md` — lines 106-112 (config section) and lines 122-134 (project structure)

## Patterns to follow

- Keep the same terse, comment-style documentation the README already uses
- Don't add lengthy explanations — just the config key and a comment for non-obvious ones
- Match the existing indentation (2 spaces)

## Tests

No tests needed — this is documentation only. Run `bun test` after to confirm nothing was accidentally broken.

## What NOT to change

- Do not rewrite other sections of the README
- Do not change any source code
- Do not change the wiki pages
- Do not change invariants

## Decision Rationale

Candidate #1 (README doc-sync) chosen over #2 (hardcoded wiki path — needs design discussion about whether to add octowiki as a dependency) and #3 (utils/fs.ts tests — only 14 LOC, minimal risk). The README inaccuracies affect every new user of the project and are straightforward to fix.
