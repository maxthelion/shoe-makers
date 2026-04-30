import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { parseSkillFile } from "../skills/registry";

const BUNDLE_DIR = resolve(import.meta.dir, "..", "..", "bundle");

function readBundle(rel: string): string {
  return readFileSync(join(BUNDLE_DIR, rel), "utf8");
}

const SKILL_TEMPLATES = [
  "implement",
  "fix-tests",
  "test-coverage",
  "doc-sync",
  "health",
  "octoclean-fix",
  "bug-fix",
  "dead-code",
  "dependency-update",
].map((name) => ({ name, template: readBundle(`skills/${name}.md`) }));

const REQUIRED_FRONTMATTER = ["name:", "description:", "maps-to:", "risk:"];
const REQUIRED_SECTIONS = [
  "## When to apply",
  "## Instructions",
  "## Verification criteria",
  "## Permitted actions",
  "## Off-limits",
];

describe("skill templates", () => {
  for (const { name, template } of SKILL_TEMPLATES) {
    describe(name, () => {
      test("has YAML frontmatter delimiters", () => {
        expect(template).toMatch(/^---\n/);
        expect(template).toContain("\n---\n");
      });

      for (const field of REQUIRED_FRONTMATTER) {
        test(`has required frontmatter field: ${field}`, () => {
          const frontmatter = template.split("---")[1];
          expect(frontmatter).toContain(field);
        });
      }

      for (const section of REQUIRED_SECTIONS) {
        test(`has required section: ${section}`, () => {
          expect(template).toContain(section);
        });
      }
    });
  }
});

describe("skill template roundtrip (parseSkillFile)", () => {
  for (const { name, template } of SKILL_TEMPLATES) {
    test(`${name} can be parsed by the registry`, () => {
      const parsed = parseSkillFile(template);
      expect(parsed.name).toBe(name);
      expect(parsed.description.length).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(parsed.risk);
      expect(parsed.body.length).toBeGreaterThan(0);
      expect(parsed.mapsTo.length).toBeGreaterThan(0);
    });
  }
});

describe("config template", () => {
  const CONFIG_CONTENT = readBundle("config.yaml");
  test("has branch-prefix", () => {
    expect(CONFIG_CONTENT).toContain("branch-prefix:");
  });
  test("has tick-interval", () => {
    expect(CONFIG_CONTENT).toContain("tick-interval:");
  });
  test("has wiki-dir", () => {
    expect(CONFIG_CONTENT).toContain("wiki-dir:");
  });
  test("has max-ticks-per-shift", () => {
    expect(CONFIG_CONTENT).toContain("max-ticks-per-shift:");
  });
});

describe("schedule template", () => {
  const SCHEDULE_CONTENT = readBundle("schedule.md");
  test("has start field", () => {
    expect(SCHEDULE_CONTENT).toContain("start:");
  });
  test("has end field", () => {
    expect(SCHEDULE_CONTENT).toContain("end:");
  });
});

describe("invariants template", () => {
  const INVARIANTS_TEMPLATE = readBundle("invariants.md");
  test("has section headings", () => {
    expect(INVARIANTS_TEMPLATE).toContain("## 1.");
    expect(INVARIANTS_TEMPLATE).toContain("## 2.");
  });
  test("has subsection headings", () => {
    expect(INVARIANTS_TEMPLATE).toContain("### 1.1");
    expect(INVARIANTS_TEMPLATE).toContain("### 2.1");
  });
  test("has bullet point placeholders", () => {
    expect(INVARIANTS_TEMPLATE).toContain("- (");
  });
});

describe("protocol template", () => {
  const PROTOCOL_CONTENT = readBundle("protocol.md");
  test("references next-action.md", () => {
    expect(PROTOCOL_CONTENT).toContain("next-action.md");
  });
  test("references bun run setup", () => {
    expect(PROTOCOL_CONTENT).toContain("bun run setup");
  });
  test("references bun test", () => {
    expect(PROTOCOL_CONTENT).toContain("bun test");
  });
});

describe("manifest", () => {
  const MANIFEST = readBundle("manifest.yaml");
  test("declares name shoe-makers", () => {
    expect(MANIFEST).toMatch(/name:\s*shoe-makers/);
  });
  test("lists all skill files", () => {
    for (const { name } of SKILL_TEMPLATES) {
      expect(MANIFEST).toContain(`skills/${name}.md`);
    }
  });
});
