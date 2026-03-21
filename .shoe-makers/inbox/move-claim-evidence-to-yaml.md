# Move CLAIM_EVIDENCE to YAML

`src/verify/claim-evidence.ts` is 297 lines of data pretending to be code. It's a map of claim IDs to string patterns. It inflates the complexity score and makes octoclean flag invariants.ts as the worst file.

Move it to `.shoe-makers/evidence.yaml` (or `.shoe-makers/claim-evidence.yaml`). The checker reads and parses the YAML at runtime. The format should be straightforward:

```yaml
behaviour-tree.tree-evaluator:
  source:
    - [export function evaluate]
  test:
    - ["evaluate("]

behaviour-tree.selector-tries-children:
  source:
    - ['"selector"']
    - [children]
  test:
    - [selector]
```

Each claim ID maps to source and test evidence groups (AND-of-OR, same logic as now).

Benefits:
- Removes ~300 lines of TypeScript from complexity scoring
- Makes evidence patterns editable without TypeScript knowledge
- Clearly separates data from logic
- The reviewer can audit evidence patterns without reading code

The invariants checker (`src/verify/invariants.ts`) already imports from `claim-evidence.ts` — just change the import to read and parse YAML instead. You can use the same flat YAML parser from `config/load-config.ts` or parse it manually since the structure is simple.

Delete `src/verify/claim-evidence.ts` after migration.
