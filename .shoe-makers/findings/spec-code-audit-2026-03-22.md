# Finding: Spec vs Code Audit — 2026-03-22

Systematic comparison of wiki spec against actual code. Found stale specs, dead code, and undocumented behaviour.

## Fixed This Session

- **skills.md**: Moved octoclean-fix, bug-fix, dead-code from "planned" to implemented; documented `maps-to` as required
- **verification.md**: Updated permissions table to match code, added review node to tree diagram, rewrote TDD section
- **observability.md**: Fixed tick type references, blackboard lifecycle, documented ShiftSummary
- **scheduled-tasks.md**: Documented working hours and branch management; removed stale "doesn't need git management" claim
- **Skill maps-to collisions**: Gave each skill a unique maps-to value (bug-fix, dead-code, octoclean-fix); added test preventing future collisions

## Remaining Issues

### ~~Dead Code (old four-tick model leftovers)~~ — Resolved
~~These modules have tests but no production call sites:~~
- ~~`src/skills/verify.ts`~~ — deleted (no longer exists)
- ~~`src/skills/prioritise.ts`~~ — deleted (no longer exists)
- ~~`src/skills/work.ts`~~ — deleted (no longer exists)

### Dead exports and config
- `readLastAction` in `src/state/last-action.ts` — exported, never called in production (keeping: used by review process per spec)
- ~~`Config.tickInterval` — parsed from config.yaml, never consumed by any scheduler~~ — Used by evidence patterns and spec
- ~~`Config.assessmentStaleAfter` — parsed from config.yaml, never consumed~~ — Already wired in `default-tree.ts:66`

### Resolved
- ~~`suggestions` field in `formatTickLog` is defined but never populated~~ — Fixed: now wired in both `index.ts` and `shift.ts`
- ~~`Config.assessmentStaleAfter` — parsed from config.yaml, never consumed~~ — Already wired in `default-tree.ts:66`
- ~~Dead code modules (verify, prioritise, work)~~ — Files already deleted by a previous elf

## Status

Resolved.
