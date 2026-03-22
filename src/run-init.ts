import { init, bootstrapWiki } from "./init";

async function main() {
  const repoRoot = process.cwd();
  console.log("[init] Scaffolding .shoe-makers/ ...");

  const result = await init(repoRoot);

  if (result.created.length > 0) {
    console.log("[init] Created:");
    for (const file of result.created) {
      console.log(`  + ${file}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log("[init] Skipped (already exist):");
    for (const file of result.skipped) {
      console.log(`  - ${file}`);
    }
  }

  // Bootstrap wiki from existing docs (README.md, docs/*.md)
  const wikiResult = await bootstrapWiki(repoRoot);
  if (wikiResult.imported.length > 0) {
    console.log("[init] Wiki bootstrap — imported:");
    for (const file of wikiResult.imported) {
      console.log(`  + wiki/pages/${file}`);
    }
  }
  if (wikiResult.skipped.length > 0) {
    console.log("[init] Wiki bootstrap — skipped (already exist):");
    for (const file of wikiResult.skipped) {
      console.log(`  - wiki/pages/${file}`);
    }
  }

  if (result.created.length === 0 && wikiResult.imported.length === 0) {
    console.log("[init] Nothing to create — .shoe-makers/ is already set up.");
  } else {
    console.log("[init] Done. Run `bun run setup` to start.");
  }
}

main().catch((err) => {
  console.error("[init] Fatal error:", err);
  process.exit(1);
});
