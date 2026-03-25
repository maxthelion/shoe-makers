# Doc-sync: document new configurable thresholds

skill-type: doc-sync

## What to change

The previous elf added four new config keys (`health-regression-threshold`, `review-loop-threshold`, `wikipedia-timeout`, `octoclean-timeout`) to the codebase but didn't update the documentation. Update the wiki and README to reflect these new options.

## Wiki spec reference

From `wiki/pages/wiki-as-spec.md`:
> The wiki is the source of truth. Code is derived from the spec, not the other way around.

The code now has new configurable behaviour that the wiki doesn't describe.

## Changes needed

### 1. Wiki: `wiki/pages/integration.md` (line 89-98)

Add four new rows to the configuration table after the existing `enabled-skills` row:

```
| `health-regression-threshold` | `2` | Health score drop tolerance (points) before flagging regression |
| `review-loop-threshold` | `3` | Consecutive critique/fix-critique actions before circuit breaker fires |
| `wikipedia-timeout` | `10000` | Timeout for Wikipedia API requests (milliseconds) |
| `octoclean-timeout` | `120000` | Timeout for octoclean health scan (milliseconds) |
```

### 2. README.md (line 107-117)

Add the four new keys to the example config.yaml block, after the existing `max-innovation-cycles` line:

```yaml
health-regression-threshold: 2
review-loop-threshold: 3
wikipedia-timeout: 10000
octoclean-timeout: 120000
```

### 3. CHANGELOG.md

Add a new entry under `### Added` in the `[Unreleased]` section:

```
- Configurable thresholds — `health-regression-threshold`, `review-loop-threshold`, `wikipedia-timeout`, `octoclean-timeout` in config.yaml with backward-compatible defaults
```

## What NOT to change

- Do NOT modify any source code files
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages other than `wiki/pages/integration.md`
- Do NOT change existing config key documentation — only add new rows
- Do NOT reformat existing table rows or YAML blocks

## Tests to write

No tests needed — this is a documentation-only change.

## Decision Rationale

Candidate #1 was chosen because:
- **Directly addresses the work just completed**: The configurable thresholds implementation is undocumented, creating a spec-code gap.
- **Wiki is source of truth**: Per the project's core principle, new configurable behaviour must be reflected in the wiki.
- **Higher impact than other doc candidates** (#3 CHANGELOG, #5 partial-work): These config keys affect how users tune the system.
- **More impactful than test/health improvements** (#2, #4): Documentation gaps affect all users; test coverage and health score are internal quality.
