---
type: finding
date: 2026-03-22
---

# Finding: Spec-code divergence in three-phase orchestration

## Summary

The wiki (`behaviour-tree.md`) describes a three-phase orchestration model with `candidates.md` and `work-item.md` state files. The actual code (`default-tree.ts`) implements a flat condition-action selector with no file-based phase tracking.

## Details

**Wiki says** (behaviour-tree.md, lines 19-28):
- Tree has `[work-item.md exists?]` and `[candidates.md exists?]` conditions
- Explore writes `candidates.md`, prioritise writes `work-item.md`
- Three invocations: explore → prioritise → execute

**Code says** (src/tree/default-tree.ts):
- Tree is a flat selector with 12 condition-action pairs
- No conditions check for `candidates.md` or `work-item.md`
- Proactive work goes through individual conditions: open-plans, spec-gaps, untested-code, etc.
- `src/skills/prioritise.ts` and `src/skills/work.ts` exist but are not called from production code

## Impact

The `behaviour-tree.md` wiki page describes an architecture the code doesn't implement. The current flat model works (all tests pass, system operates correctly), but the spec is misleading.

## Options

1. **Update wiki to match code** — simplest, documents reality. The flat model has advantages: no inter-invocation coupling, every tick can respond to the most important condition.
2. **Update code to match wiki** — implements the three-phase model. More sophisticated but adds complexity and inter-tick state.

## What was done this session

- Updated `tick-types.md` tree diagram to match actual code (was missing 3 conditions)
- Updated `architecture.md` tree diagram and state files to match actual code
- Updated `behaviour-tree.md` — replaced three-phase orchestration with flat selector, updated state files, review mechanism, and proactive conditions
- Tightened evidence patterns for section-2 invariant claims (per critique-013)

## Status

Resolved. All three wiki pages now accurately describe the flat condition-action selector model that the code implements. The `src/skills/prioritise.ts` and `src/skills/work.ts` modules remain as dead code from the earlier design — they could be removed or repurposed in a future session.
