# Extract duplicated fileExists to shared utility

## Context

`fileExists()` is defined in two places:
- `src/init.ts:76-82` — uses `stat()` from `fs/promises`
- `src/state/world.ts:114-120` — uses `access()` from `fs/promises`

Both do the same thing (check if a file exists, return boolean). `access()` is the more correct choice for existence checks (it's lighter than `stat()`).

## What to do

1. Create `src/utils/fs.ts` with the shared `fileExists` function using `access()`
2. Update `src/init.ts` to import from `src/utils/fs.ts` instead of defining its own
3. Update `src/state/world.ts` to import from `src/utils/fs.ts` instead of defining its own
4. Run `bun test` to confirm nothing breaks

## Implementation

```typescript
// src/utils/fs.ts
import { access } from "fs/promises";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
```

## What NOT to change

- Do not modify test files
- Do not change the function's behaviour
- Do not modify wiki pages or invariants
