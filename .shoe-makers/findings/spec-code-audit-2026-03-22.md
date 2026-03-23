# Finding: Spec vs Code Audit — 2026-03-22

Systematic comparison of wiki spec against actual code. Found stale specs, dead code, and undocumented behaviour.

## Fixed This Session

- **skills.md**: Moved octoclean-fix, bug-fix, dead-code from "planned" to implemented; documented `maps-to` as required
- **verification.md**: Updated permissions table to match code, added review node to tree diagram, rewrote TDD section
- **observability.md**: Fixed tick type references, blackboard lifecycle, documented ShiftSummary
- **scheduled-tasks.md**: Documented working hours and branch management; removed stale "doesn't need git management" claim
- **Skill maps-to collisions**: Gave each skill a unique maps-to value (bug-fix, dead-code, octoclean-fix); added test preventing future collisions

## Remaining Issues

### Dead Code (old four-tick model leftovers) — Still Open
These modules have tests but no production call sites:
- `src/skills/verify.ts` — exists, imported only from tests
- `src/skills/prioritise.ts` — exists, imported only from tests
- `src/skills/work.ts` — exists, imported only from tests

Note: A previous elf incorrectly marked these as "deleted." They exist and have tests but are not wired into any production code path. Additionally, `verify.ts` uses `execSync("bun test")` which violates the pure-function agent architecture.

### Dead exports and config
- `readLastAction` in `src/state/last-action.ts` — exported, never called in production (keeping: used by review process per spec)
- ~~`Config.tickInterval` — parsed from config.yaml, never consumed by any scheduler~~ — Used by evidence patterns and spec
- ~~`Config.assessmentStaleAfter` — parsed from config.yaml, never consumed~~ — Already wired in `default-tree.ts:66`

### Resolved
- ~~`suggestions` field in `formatTickLog` is defined but never populated~~ — Fixed: now wired in both `index.ts` and `shift.ts`
- ~~`Config.assessmentStaleAfter` — parsed from config.yaml, never consumed~~ — Already wired in `default-tree.ts:66`
- ~~Dead code modules (verify, prioritise, work)~~ — Incorrectly marked as deleted; files still exist. See "Dead Code" section above.

## Status

Partially resolved — dead code modules (verify, prioritise, work) still exist without production callers. verify.ts also has an architectural violation (execSync).
