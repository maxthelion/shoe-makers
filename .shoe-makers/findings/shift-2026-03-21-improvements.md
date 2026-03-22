# Finding: Specified-only invariants reduced from 57 to 8

## What happened

This shift focused on reducing the specified-only invariant count by implementing missing features and adding evidence entries for already-implemented ones.

## Features implemented

1. **Init command** (`bun run init`) — scaffolds `.shoe-makers/` with protocol, config, skills, schedule, invariants, and directory structure. Safe to run multiple times.
2. **Health regression check** — verify step now compares health scores before/after work, flagging regressions beyond a 2-point tolerance.
3. **TDD enforcement in permissions** — `implement-spec`, `implement-plan`, and `improve-health` roles can no longer write to `src/__tests__/`. Only `write-tests` and `fix-tests` can touch tests.
4. **Last-action.md saving** — setup saves the action prompt for cross-elf review compliance checking. Critique prompt references it.
5. **Off-limits parsing from skill files** — skill registry now parses `## Off-limits` sections into structured arrays.
6. **Suggestions in shift log** — `formatTickLog` supports a suggestions array for next-priority hints.
7. **Enabled-skills config** — `config.yaml` supports `enabled-skills` to control which skills are active.

## Evidence entries added

~42 evidence entries added for spec claims that were already implemented in code but lacked claim-evidence.yaml mappings.

## Remaining 8 specified-only

All 8 remaining are aspirational/emergent:
- "genuine improvements across multiple categories" (emergent)
- "balanced improvements" (emergent)
- "unexpected, delightful results" (emergent)
- "quality over speed" (design principle)
- "planned skills: octoclean-fix, bug-fix, etc." (future work)
- "friction → scripts" (meta-principle)
- "protocol evolves" (meta-principle)
- "system builds the system" (meta-principle)

These describe properties that emerge from the whole system working together, not features that can be individually coded.

## Status

Complete.

## Status

Resolved.
