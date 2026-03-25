# Fix stale claim-evidence location reference in wiki invariants page

skill-type: doc-sync

## Context

`wiki/pages/invariants.md` line 59 says:

> The claim-to-evidence mapping is manually curated in `src/verify/invariants.ts`.

This is incorrect. The evidence mapping was moved to `.shoe-makers/claim-evidence.yaml` and is parsed by `src/verify/parse-evidence.ts` (line 12: `const EVIDENCE_PATH = ".shoe-makers/claim-evidence.yaml"`).

## What to change

In `wiki/pages/invariants.md`, line 59, change:

```
The claim-to-evidence mapping is manually curated in `src/verify/invariants.ts`.
```

To:

```
The claim-to-evidence mapping is defined in `.shoe-makers/claim-evidence.yaml` and parsed by `src/verify/parse-evidence.ts`.
```

Also update the frontmatter `last-modified-by` from `user` to `elf`.

## What NOT to change

- Do not modify `.shoe-makers/invariants.md`
- Do not modify source code
- Do not change any other wiki pages

## Decision Rationale

This is the highest impact candidate because the wiki is the source of truth. A factual error about where evidence mappings live would mislead anyone trying to understand or modify the invariants system. The other candidates (test consolidation, archive edge cases) are lower priority cosmetic improvements.
