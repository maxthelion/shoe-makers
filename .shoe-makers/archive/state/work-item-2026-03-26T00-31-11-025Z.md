skill-type: implement

# Split claim-evidence.yaml into per-section files with multi-file parser

## Context

`.shoe-makers/claim-evidence.yaml` is 2012 lines — the single biggest merge-conflict source in the `.shoe-makers/` directory. When two branches modify different sections' evidence patterns, they conflict. The file has clear section markers (`# === section.md ===`) that can be used as split points.

The inbox message `structural-modularity.md` specifically requested this split.

## What to change

### 1. Update `loadClaimEvidence` in `src/verify/parse-evidence.ts`

Change `loadClaimEvidence` to:
1. First try to read files from `.shoe-makers/claim-evidence/` directory (glob `*.yaml`)
2. If the directory exists and has files, concatenate all YAML files and parse them
3. Fall back to the single `.shoe-makers/claim-evidence.yaml` file if the directory doesn't exist
4. This preserves backward compatibility — existing repos with a single file still work

```typescript
export async function loadClaimEvidence(repoRoot: string): Promise<Record<string, EvidenceRule>> {
  // Try multi-file directory first
  const dirPath = join(repoRoot, EVIDENCE_DIR);
  try {
    const files = await readdir(dirPath);
    const yamlFiles = files.filter(f => f.endsWith(".yaml") || f.endsWith(".yml")).sort();
    if (yamlFiles.length > 0) {
      let combined = "";
      for (const file of yamlFiles) {
        const content = await readFile(join(dirPath, file), "utf-8");
        combined += content + "\n";
      }
      return parseClaimEvidenceYaml(combined);
    }
  } catch {}

  // Fall back to single file
  try {
    const content = await readFile(join(repoRoot, EVIDENCE_PATH), "utf-8");
    return parseClaimEvidenceYaml(content);
  } catch {
    return {};
  }
}
```

Add `import { readdir } from "fs/promises"` and `const EVIDENCE_DIR = ".shoe-makers/claim-evidence"`.

### 2. Split the YAML file

Create `.shoe-makers/claim-evidence/` directory and split `claim-evidence.yaml` by its section markers. Keep the header comment in each file. Name files by their section: `behaviour-tree.yaml`, `architecture.yaml`, etc.

After splitting, delete the original `claim-evidence.yaml`.

### 3. Write tests

Add tests in `src/__tests__/parse-evidence.test.ts`:
- `loadClaimEvidence` loads from directory when it exists
- `loadClaimEvidence` falls back to single file when directory doesn't exist
- Multi-file loading merges claims from all files correctly
- Empty directory falls back to single file

## Patterns to follow

- Look at `src/__tests__/parse-evidence.test.ts` for existing test patterns
- The parser (`parseClaimEvidenceYaml`) doesn't need changes — it already handles comments and concatenated content

## What NOT to change

- Do not modify `parseClaimEvidenceYaml` — it already works with concatenated content
- Do not modify `src/verify/invariants.ts` — it calls `loadClaimEvidence` which handles the abstraction
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Candidate #2 chosen over #1 (structured skills) because it's more concrete and testable — a single function change + file reorganization. Structured skills is a multi-tick design effort. Candidate #3 (test coverage) can wait until the modules stabilize. Candidate #4 is already tracked.
