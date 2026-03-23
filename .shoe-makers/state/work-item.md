# Add claim-evidence entries for archiveResolvedFindings and countInsights

skill-type: test

## Context

Two features were added this shift without corresponding claim-evidence entries:
1. `archiveResolvedFindings()` in `src/skills/assess.ts` — auto-archives resolved findings
2. `countInsights()` in `src/state/world.ts` — counts pending insight files (was previously hardcoded to 0)

## Relevant spec claims

Check `.shoe-makers/invariants.md` and `wiki/pages/` for claims about:
- Findings lifecycle / archiving
- Insights counting / creative exploration pipeline

If no existing spec claims cover these features, that's fine — they may be "unspecified" features that the invariants checker will flag for human review. In that case, do NOT add new claims to invariants.md (that's human-only). Instead, just add evidence entries for any existing claims that these features help satisfy.

## What to do

1. Read `.shoe-makers/claim-evidence.yaml` to understand the format
2. Search for existing claims related to findings, archiving, insights, or creative exploration
3. If matching claims exist, add evidence entries that reference the new source code patterns:
   - `archiveResolvedFindings` — source pattern in `src/skills/assess.ts`
   - `countInsights` — source pattern in `src/state/world.ts`
   - Test patterns from `src/__tests__/archive.test.ts` and `src/__tests__/count-insights.test.ts`
4. Run `bun test` to verify nothing breaks (evidence entries are validated by the invariants test)
5. Commit

## What NOT to change

- Don't modify `.shoe-makers/invariants.md` — human-only
- Don't modify any source code — only `.shoe-makers/claim-evidence.yaml`
- Don't invent new claim IDs — only add evidence for existing claims
