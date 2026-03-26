# Candidates

## 1. Implement structured skill templates for critique output format
**Type**: implement
**Impact**: high
**Reasoning**: The `wiki/pages/structured-skills.md` spec describes semi-deterministic skill templates where setup pre-fills mechanical parts and the elf only provides judgement. The inbox message `structured-skills.md` prioritized write-critique as the #1 skill to structure. Currently `src/prompts/critique.ts` generates a free-form prompt — the elf has to figure out filename, sections, status format. The spec says setup should auto-number the filename, define exact sections (Changes Reviewed, Assessment, Issues Found, Status), and include the diff and commit range. This would reduce wasted ticks on format compliance. Relates to invariants section 3.2.1.

## 2. Split claim-evidence.yaml into per-section files with multi-file parser
**Type**: implement
**Impact**: medium
**Reasoning**: The structural-modularity inbox message asked for claim-evidence splitting. `claim-evidence.yaml` is 2012 lines — the single biggest merge-conflict source in `.shoe-makers/`. `src/verify/parse-evidence.ts` reads it from a single path. The fix: update `parseEvidence()` to glob `claim-evidence/*.yaml` or fall back to the single file, then split the YAML by its section markers (`# === section.md ===`). This is a concrete, testable change that directly addresses the inbox request. The parser change is ~20 lines.

## 3. Add tests for src/setup/ extracted modules
**Type**: test-coverage
**Impact**: medium
**Reasoning**: The setup.ts split created `src/setup/branch.ts`, `src/setup/world-state.ts`, `src/setup/format-action.ts`, and `src/setup/housekeeping.ts`. These modules were extracted from `src/setup.ts` and are tested indirectly through `src/__tests__/setup.test.ts`, but the individual modules have no dedicated tests. `format-action.ts` in particular contains `formatAction()` and `readWikiOverview()` which have distinct edge cases (no skill, inbox messages, wiki file missing). Adding targeted tests would improve the health score and catch regressions if these modules are modified independently.

## 4. Surface stale invariants as a finding for human action
**Type**: doc-sync
**Impact**: low
**Reasoning**: The existing finding `stale-invariants-skills-list.md` documents that invariants section 3.2 lists skills as "planned" that are now implemented, section 2.2 is missing reactive conditions, and sections have duplicate numbering. Since elves can't modify invariants.md, the only action is to write a prominent finding. But this finding already exists and is open. No action needed — low priority.
