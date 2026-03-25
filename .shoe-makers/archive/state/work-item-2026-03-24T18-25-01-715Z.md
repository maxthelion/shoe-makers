# Work Item: Fix claim-evidence patterns for invariant 2.6.1

skill-type: doc-sync

## Summary

The 3 specified-only invariants from section 2.6.1 (innovate observability) were caused by mismatched evidence patterns in `.shoe-makers/claim-evidence.yaml`. The code implementation was correct but the evidence patterns didn't match because:

1. One claim ID had an extra trailing hyphen (`the-innovate-prompt-output-the-insight-file-must-include-the-:` instead of `the-innovate-prompt-output-the-insight-file-must-include-the:`)
2. Source patterns used `MUST use the Wikipedia article` but the actual code contains `**MUST** use the Wikipedia article` (with markdown bold) — the `**` characters break the string match
3. Two claims (`the-insight-file-must-reference...` and `this-observability-allows...`) had no evidence entries at all

## Changes Made

Fixed all 5 claim-evidence entries for invariant 2.6.1:
- Fixed claim ID typo (removed extra `-`)
- Changed source patterns to match code without markdown (`use the Wikipedia article` instead of `MUST use the Wikipedia article`)
- Added missing entries for insight-file-must-reference and observability-allows-human

## Decision Rationale

This was chosen over the other candidates because:
- It directly closes the 3 specified-only invariants, moving the codebase to 0 gaps
- It unblocks the innovation tier (which requires all invariants met)
- Higher priority than test coverage (candidate #1/#2) since invariant gaps block the three-phase cycle
- Higher priority than health refactoring (candidate #3) since it's a correctness issue, not a style issue

## Verification

After the fix: `specifiedOnly: 0, implementedTested: 221`
