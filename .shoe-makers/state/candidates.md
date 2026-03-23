# Candidates

## 1. Wire insights into the prioritise prompt so pending insights get evaluated
**Type**: implement
**Impact**: high
**Reasoning**: The creative exploration spec (`wiki/pages/creative-exploration.md`) describes a full loop: explore generates insights, prioritiser evaluates them (promote/rework/dismiss). The `buildPrioritisePrompt` in `src/prompts.ts:183-223` already tells the elf to read `.shoe-makers/insights/` and evaluate them. World state tracks `insightCount` (`src/setup.ts:203`) but it's hardcoded to 0. The missing piece: `setup.ts:buildWorldState()` needs to actually count insight files, and the insight count should be surfaced in the prioritise prompt so the elf knows insights exist. This is a small wiring fix that unlocks the creative tier. Skill type: `implement`.

## 2. Metrics summary appended to shift log at end of shift
**Type**: implement
**Impact**: medium
**Reasoning**: Shift logs record individual ticks but have no summary. Adding a per-shift metrics block (total ticks, work categories, health delta, findings created/resolved) at the end of each shift would make morning review faster. The `src/log/shift-summary.ts` module already categorizes improvements — it just needs to be called and appended. This would make morning review delightful instead of just informative. Skill type: `implement`.

## 3. Count insight files in buildWorldState instead of hardcoding 0
**Type**: bug-fix
**Impact**: medium
**Reasoning**: `src/setup.ts:203` has `insightCount: 0` hardcoded. The insights directory exists at `.shoe-makers/insights/` and the init scaffolding creates it. There should be a `countInsights()` function in `src/state/world.ts` (similar to `countUnresolvedCritiques()`) that reads the directory. Without this, the system can never know insights exist. This is a prerequisite for candidate #1 but can be done independently. Skill type: `bug-fix`.
