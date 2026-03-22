# Finding: Octoclean integration complete

## What was done

Integrated octoclean (`github:maxthelion/octoclean`) into the assessment pipeline:

- Added as a dependency in `package.json`
- New module `src/skills/health-scan.ts` runs `codehealth scan --no-llm` and parses the JSON output
- `assess()` now calls `getHealthScore()` in parallel with other assessment tasks
- `assessment.json` now has a real `healthScore` (0-100) instead of null
- The tree condition `healthBelowThreshold` (score < 70) fires when quality drops

## Current health score

70/100 (just at threshold). Worst files by complexity:
1. `src/verify/invariants.ts` — complexity 73 (data-heavy, extracted `CLAIM_EVIDENCE` to separate file)
2. `src/__tests__/evaluate.test.ts` — complexity 27
3. `src/__tests__/shift.test.ts` — complexity 24

## Notes

- Octoclean requires `lizard` (Python) for complexity analysis. Optional tools (`jscpd`, `madge`, `ts-unused-exports`) are not installed — scan works without them but scores are less precise.
- The scan takes ~5-10 seconds, which adds to assessment time.
- If octoclean scan fails (e.g., missing dependencies), `getHealthScore()` returns null gracefully.

## Status

Complete.

## Status

Resolved.
