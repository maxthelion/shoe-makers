# Finding: Spec vs Code Audit — 2026-03-22

Systematic comparison of wiki spec against actual code. Found stale specs, dead code, and undocumented behaviour.

## Fixed This Session

- **skills.md**: Moved octoclean-fix, bug-fix, dead-code from "planned" to implemented; documented `maps-to` as required
- **verification.md**: Updated permissions table to match code, added review node to tree diagram, rewrote TDD section
- **observability.md**: Fixed tick type references, blackboard lifecycle, documented ShiftSummary
- **scheduled-tasks.md**: Documented working hours and branch management; removed stale "doesn't need git management" claim
- **Skill maps-to collisions**: Gave each skill a unique maps-to value (bug-fix, dead-code, octoclean-fix); added test preventing future collisions

## Remaining Issues

### Dead Code (old four-tick model leftovers)
These modules have tests but no production call sites:
- `src/skills/verify.ts` — verify skill (old VERIFY tick)
- `src/skills/prioritise.ts` — prioritise skill (old PRIORITISE tick)
- `src/skills/work.ts` — work skill (old WORK tick)

### Dead exports and config
- `readLastAction` in `src/state/last-action.ts` — exported, never called in production
- `Config.tickInterval` — parsed from config.yaml, never consumed by any scheduler
- `Config.assessmentStaleAfter` — parsed from config.yaml, never consumed

### Resolved
- ~~`suggestions` field in `formatTickLog` is defined but never populated~~ — Fixed: now wired in both `index.ts` and `shift.ts`
- ~~`Config.assessmentStaleAfter` — parsed from config.yaml, never consumed~~ — Already wired in `default-tree.ts:66`

## Status

Partially resolved — wiki fixes, collision fix, and suggestions wiring done. Dead code modules (verify, prioritise, work skills) and unused `readLastAction`/`Config.tickInterval` remain for future elf.
