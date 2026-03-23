# Candidates

## 1. Add creative-exploration.md and verification.md to CLAUDE.md key pages
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: CLAUDE.md's "Key pages" section lists 8 wiki pages but omits `creative-exploration.md` (the Wikipedia lens feature) and `verification.md` (role-based permissions, adversarial review, TDD enforcement). Both are important spec pages that a new elf should read. Simple addition of 2 lines.

## 2. Add insights count to world state
**Type**: implement
**Impact**: high
**Confidence**: medium
**Risk**: medium
**Reasoning**: The creative-exploration spec describes insights being reviewed by prioritise. Currently no code reads `.shoe-makers/insights/`. Needs changes to types.ts, world.ts/assess.ts, and tests. Higher risk but completes a specified feature.

## 3. Run octoclean on worst files to identify specific improvements
**Type**: health
**Impact**: medium
**Confidence**: medium
**Risk**: low
**Reasoning**: The health score has been stuck at 99/100 with the same 3 worst files for the entire session. Running octoclean directly on those files might reveal specific, actionable suggestions (unused imports, extract-function opportunities, etc.) beyond what the score alone tells us.
