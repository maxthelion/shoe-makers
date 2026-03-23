# Candidates

## 1. Add src/utils/ to wiki project structure documentation
**Type**: doc-sync
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: The invariants checker reports 1 unspecified directory (`src/utils/`). Adding it to the project structure in `wiki/pages/architecture.md` would clear this invariant violation. The directory was created in this session's fileExists extraction.

## 2. Add test for findSkillForAction edge cases
**Type**: test
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: `src/prompts.ts:21-32` findSkillForAction returns undefined when skills exist but none match. The existing test "non-work actions ignore skills" covers this indirectly but a more explicit test with a mismatched skill map would strengthen coverage.

## 3. Add inbox prompt test for zero messages
**Type**: test
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The inbox prompt interpolates `state.inboxCount`. Current test verifies count=5, but count=0 edge case is untested (though the tree shouldn't route to inbox with 0 messages, the prompt function doesn't guard against it).
