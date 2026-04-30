---
name: doc-sync
description: Sync wiki pages with code changes to keep spec accurate.
maps-to: doc-sync
risk: low
---

## When to apply

The invariants pipeline reports `unspecified` items — code that exists but isn't documented in the wiki. Or wiki pages are stale relative to recent code changes.

## Instructions

1. Identify what's in code but not in the wiki (or what's changed since the wiki was last updated).
2. Read the relevant source files to understand current behaviour.
3. Update the wiki page(s) to accurately reflect the implementation.
4. Preserve the wiki page's frontmatter (title, category, tags, summary).
5. Keep wiki pages factual and concise — describe what IS, not what should be.

## Verification criteria

- Updated wiki pages accurately describe the current code
- Frontmatter is preserved and correct
- No speculative content added (only document what's built)

## Permitted actions

- Modify existing wiki pages
- Create new wiki pages if a topic warrants its own page

## Off-limits

- Do not modify source code (this skill is docs-only)
- Do not remove wiki content that describes planned/future features (mark as "not yet implemented" instead)
- Do not change page categories or tags without reason
