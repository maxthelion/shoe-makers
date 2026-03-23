# Candidates

## 1. Morning Review Dashboard — Make shift log scannable at a glance
**Type**: improve
**Impact**: high
**Skill**: implement
**Reasoning**: `wiki/pages/observability.md` says "The morning review should be self-contained: shift log + findings + commits = full picture." Currently the shift log is a chronological dump of tick entries. `src/log/shift-summary.ts` computes categories/balance but the output is a flat markdown block buried at the end. A proper dashboard block at the top of the log — with action counts by category, success/error ratio, top findings, and a one-sentence narrative — would make the morning review delightful. Files: `src/log/shift-log.ts`, `src/log/shift-summary.ts`, `src/scheduler/shift.ts`.

## 2. Exploration Cache — Detect and flag stuck candidates
**Type**: improve
**Impact**: medium
**Skill**: implement
**Reasoning**: When explore produces a candidate that doesn't get addressed (e.g. prioritiser picks something else), the same candidate resurfaces next cycle. There's no mechanism to detect this loop. Adding candidate fingerprinting (hash the top candidates) and flagging when the same candidate appears 3+ times as "stuck" would add a useful feedback signal for humans. This prevents infinite loops on unfixable issues and surfaces blockers. Files: `src/state/blackboard.ts`, `src/skills/assess.ts`, `src/prompts.ts`.

## 3. Worst-file health drill-down in explore prompt
**Type**: improve
**Impact**: medium
**Skill**: implement
**Reasoning**: The explore prompt gets `worstFiles` (3 files with scores) but no detail on *why* they score poorly. `src/__tests__/prompts.test.ts` scores 88 — the lowest — but the explore elf can't see what's wrong with it. If the assessment included per-file health breakdown (complexity, length, duplication) and the explore prompt surfaced it, the elf could write targeted health improvement candidates. Currently `src/skills/assess.ts` computes health via octoclean but only exposes the score. Files: `src/skills/assess.ts`, `src/prompts.ts`, `src/types.ts`.
