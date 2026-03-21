# Finding: Plan detection was matching by filename instead of frontmatter

## What happened

The assess skill's `findOpenPlans()` function detected wiki pages as "plans" if the filename contained the word "plan":

```ts
if (file.includes("plan") || content.match(/^---[\s\S]*?type:\s*plan[\s\S]*?---/m))
```

This caused `plans-vs-spec.md` (a spec page about the plan/spec distinction) to be falsely reported as an open plan. The frontmatter check also used `type: plan` instead of `category: plan`.

## Why it matters

- The prioritise skill uses open plans to generate work items. False positives mean agents would try to "implement" the plans-vs-spec page, which is a spec page, not a plan.
- The wiki clearly states that plan pages have `category: plan` in frontmatter (see `wiki/pages/plans-vs-spec.md`).

## What was done

Fixed `findOpenPlans()` to only check frontmatter `category: plan`. Filename matching removed. Updated test to use proper frontmatter.

## Status

Resolved in commit `3151066`.
