# Fix invariants granularity — this is the top priority

The system keeps sleeping because the invariants checker is too coarse. It maps wiki pages to source directories and says "implemented" if any code exists. But a wiki page like `behaviour-tree.md` describes 10+ distinct behaviours — macro/micro priority, staleness-driven pacing, the blackboard pattern, the NPC model, etc. Most of these aren't implemented, but the checker can't see that.

This is why the behaviour tree never finds work. The assessment says everything is fine. It's not.

## What needs to happen

The invariants checker needs to extract **specific falsifiable claims** from each wiki page and check each one individually. For example, from `behaviour-tree.md`:

- "The system should almost never sleep" → currently always sleeps, FAIL
- "Staleness checks drive the pacing" → assessment staleness works, PASS
- "The PRIORITISE tick uses an LLM to weigh candidates" → uses deterministic heuristic, FAIL
- "Two levels of priority: macro in tree, micro in LLM prioritiser" → no LLM prioritiser, FAIL

This is the project's most important gap right now. Everything else (the tick loop, the skill registry, the shift runner) is working. But the system can't find its own work because the assessment is too shallow.

The wiki page `invariants.md` and `wiki-as-spec.md` describe this — read them. OctoWiki has a full four-stage invariants pipeline that does this with LLM extraction. You don't need to build the full thing — even a version that splits wiki pages into paragraphs and checks each one would be a huge improvement over the current directory-level mapping.

For this project, infrastructure IS the product. The wiki describes infrastructure, so invariants about infrastructure are real invariants. Don't skip them.
