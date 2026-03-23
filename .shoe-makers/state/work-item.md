# Add src/utils/ to CLAUDE.md project structure

## Context

The `src/utils/` directory was created in this session to hold shared utilities (currently `fs.ts` with `fileExists()`). The invariants checker reports 1 unspecified directory. CLAUDE.md lists the `src/` project structure but doesn't include `utils/`.

## What to do

Add `utils/` to the project structure in `CLAUDE.md` after the `log/` entry:

```
  utils/                — Shared utility functions
```

## What NOT to change

- Do not modify wiki pages (the wiki architecture.md describes `.shoe-makers/` structure, not `src/`)
- Do not modify source code
- Do not modify invariants
