# Candidates

## 1. Add insight reading to explore/prioritise prompts
**Type**: implement
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: The creative lens section in the explore prompt tells elves to write insights to `.shoe-makers/insights/`. But neither the explore nor prioritise prompts tell elves to READ existing insights. Per `wiki/pages/creative-exploration.md`, insights should be reviewed by a future prioritise elf who decides: promote, defer, or dismiss. Adding a step to the prioritise prompt to read and evaluate insights would resolve 3 of the 6 remaining specified-only invariants. Affects `src/prompts.ts` explore and prioritise cases.

## 2. Add `insightFrequency` to default config.yaml
**Type**: doc-sync
**Impact**: low
**Confidence**: high
**Risk**: low
**Reasoning**: The config.yaml template in `src/init-templates.ts` doesn't include `insight-frequency`. Adding it makes the config discoverable. Also update the project's own `.shoe-makers/config.yaml` to document the setting.

## 3. Implement insight-suggests-invariants via findings
**Type**: implement
**Impact**: medium
**Confidence**: medium
**Risk**: low
**Reasoning**: Invariant "elves should suggest new invariants via findings" is specified-only. The explore prompt could include a step: "If you find code without a matching invariant, write a finding suggesting a new invariant." This is a prompt change + evidence pattern.
