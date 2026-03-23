# Candidates

## 1. Shift Summary Dashboard — better morning reviews
**Type**: improve
**Impact**: high
**Reasoning**: The shift log is a raw chronological transcript. A human reviewing in the morning must manually count actions and browse commits to understand what was accomplished. `src/log/shift-summary.ts` exists and generates a `ShiftSummary` but it's not written to the log file. Adding a summary block at the end of each shift with work breakdown by category, balance indicator, and improvement velocity would transform the morning review from "read a transcript" to "scan a dashboard." The wiki (`wiki/pages/observability.md`) describes this intent: "the shift log tells a narrative, not just facts." Files: `src/log/shift-summary.ts`, `src/log/shift-log.ts`, `src/shift.ts`.

## 2. Explore/prioritise prompts need richer context
**Type**: improve
**Impact**: medium
**Reasoning**: Explore and prioritise prompts tell agents "5 specified-only invariants exist" but don't show which ones or their importance. The assessment already contains `topSpecGaps` with descriptions — passing these into the prompt would let agents make better prioritisation decisions without needing to read assessment.json manually. Similarly, `topUntested` and `worstFiles` could inform candidates. Files: `src/prompts.ts` lines 195-271 (explore) and 151-193 (prioritise), `src/setup.ts`.

## 3. Skill catalog in explore prompt
**Type**: improve
**Impact**: medium
**Reasoning**: Explore and prioritise agents are "skill-blind" — they don't know what skill types exist when writing candidates. The skill registry (`src/skills/registry.ts`) loads 9 skills but this information never appears in explore/prioritise prompts. Adding a one-line summary of each available skill to the explore prompt would help agents propose work that maps cleanly to existing skills. This is a small change with outsized impact on agent ergonomics. Files: `src/prompts.ts`, `src/skills/registry.ts`.
