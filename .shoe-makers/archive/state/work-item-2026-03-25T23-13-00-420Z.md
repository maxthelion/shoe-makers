# Extract hardcoded thresholds to config.yaml

skill-type: health

## What to build

Add four new config keys to make currently-hardcoded thresholds configurable, with the current values as defaults:

| Config key | Default | Where it's hardcoded |
|---|---|---|
| `health-regression-threshold` | `2` | `src/verify/health-regression.ts:11` |
| `review-loop-threshold` | `3` | `src/tree/default-tree.ts:32`, `src/log/shift-summary.ts:270,278,282`, `src/log/shift-log-parser.ts:64,72,76` |
| `wikipedia-timeout` | `10000` | `src/creative/wikipedia.ts:119,129` |
| `octoclean-timeout` | `120000` | `src/skills/health-scan.ts:34` |

## Wiki spec reference

From `wiki/pages/architecture.md` — the config system is designed for tunability:
> `.shoe-makers/config.yaml` — overridable settings

From `wiki/pages/verification.md` — thresholds should be adjustable:
> The verification gate runs automatically and checks health regression

## Relevant code

### Config type (`src/types.ts:163-181`)

Add four new fields to the `Config` interface:
```typescript
healthRegressionThreshold: number;
reviewLoopThreshold: number;
wikipediaTimeout: number;
octocleanTimeout: number;
```

### Config loader (`src/config/load-config.ts`)

1. Add the four new keys to `KNOWN_KEYS` set (lines 7-16): `health-regression-threshold`, `review-loop-threshold`, `wikipedia-timeout`, `octoclean-timeout`
2. Add defaults to `DEFAULTS` (lines 18-27): `healthRegressionThreshold: 2`, `reviewLoopThreshold: 3`, `wikipediaTimeout: 10000`, `octocleanTimeout: 120000`
3. Add parsing in `loadConfig()` return (lines 96-107): use `intOrDefault` for each new key

### Health regression (`src/verify/health-regression.ts`)

Change `checkHealthRegression` to accept a third parameter `threshold: number = 2` instead of using the constant. Callers that pass config should thread through the value. If no config is available, the default parameter keeps backward compatibility.

### Default tree (`src/tree/default-tree.ts:30-33`)

The `reviewLoopExhausted` function hardcodes `>= 3`. Change to read from `state.config?.reviewLoopThreshold ?? 3`.

### Shift summary (`src/log/shift-summary.ts:270-282`)

The `analyzeProcessPatterns` function hardcodes `>= 3` for review loop detection. Accept an optional threshold parameter (default 3).

### Shift log parser (`src/log/shift-log-parser.ts:64-76`)

Same pattern — the `computeProcessPatterns` function hardcodes `>= 3`. Accept an optional threshold parameter (default 3).

### Wikipedia (`src/creative/wikipedia.ts:119,129`)

The two `AbortSignal.timeout(10_000)` calls should use a timeout parameter. The `fetchRandomArticle` function (or similar) should accept an options object or timeout parameter, defaulting to 10000.

### Health scan (`src/skills/health-scan.ts:34`)

The `timeout: 120_000` in the spawn call should use a timeout parameter, defaulting to 120000.

## Patterns to follow

Follow the existing config pattern exactly:
- Kebab-case keys in YAML (`health-regression-threshold`)
- CamelCase fields in TypeScript (`healthRegressionThreshold`)
- `intOrDefault` helper for parsing integers
- Default values in the `DEFAULTS` constant
- Add to `KNOWN_KEYS` for unknown-key warnings

For threading config values, follow how `maxInnovationCycles` is threaded through `WorldState.config` into `default-tree.ts:94`:
```typescript
const maxCycles = state.config?.maxInnovationCycles ?? 3;
```

## Tests to write

1. **Config tests** (`src/__tests__/config.test.ts`): Add tests for parsing each new key, including invalid values falling back to defaults
2. **Health regression tests** (`src/__tests__/health-regression.test.ts`): Add test that custom threshold is respected (e.g., threshold=5 means a 4-point drop is OK)
3. **Default tree tests** (`src/__tests__/default-tree.test.ts`): Add test that review loop threshold from config is used (set config.reviewLoopThreshold=5, verify loop doesn't break at count=3)
4. **Shift summary/parser tests**: Add tests with custom thresholds

## What NOT to change

- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages (this is a code health improvement, not a spec change)
- Do NOT change the default behaviour — all defaults must match current hardcoded values exactly
- Do NOT refactor unrelated code while making these changes
- Do NOT change the config.yaml file format (it stays flat key: value)

## Decision Rationale

Candidate #1 was chosen over the others because:
- **Higher impact than doc-sync items** (#2, #3): Configurability directly improves the system's adaptability for different projects with different needs. Documentation improvements are lower priority when the system is already well-documented.
- **More impactful than test coverage** (#4): The format-action and permission-setup modules work correctly; tests would add safety but not capability.
- **Candidate #5 is blocked**: Requires human action on invariants.md.
- **Aligns with the setup directive**: "Prefer implementation, improvement, and creative work over writing more tests or polishing what's already clean."
