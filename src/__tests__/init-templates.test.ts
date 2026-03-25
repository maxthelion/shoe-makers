import { describe, test, expect } from "bun:test";
import {
  CONFIG_CONTENT,
  SCHEDULE_CONTENT,
  INVARIANTS_TEMPLATE,
  PROTOCOL_CONTENT,
} from "../init-templates";
import { parseSkillFile } from "../skills/registry";
import {
  IMPLEMENT_SKILL,
  BUG_FIX_SKILL,
  OCTOCLEAN_FIX_SKILL,
  DEPENDENCY_UPDATE_SKILL,
} from "../init-skill-templates-work";
import {
  FIX_TESTS_SKILL,
  HEALTH_SKILL,
  DEAD_CODE_SKILL,
} from "../init-skill-templates-quality";
import {
  TEST_COVERAGE_SKILL,
  DOC_SYNC_SKILL,
} from "../init-skill-templates-docs";

const SKILL_TEMPLATES = [
  { name: "implement", template: IMPLEMENT_SKILL },
  { name: "fix-tests", template: FIX_TESTS_SKILL },
  { name: "test-coverage", template: TEST_COVERAGE_SKILL },
  { name: "doc-sync", template: DOC_SYNC_SKILL },
  { name: "health", template: HEALTH_SKILL },
  { name: "octoclean-fix", template: OCTOCLEAN_FIX_SKILL },
  { name: "bug-fix", template: BUG_FIX_SKILL },
  { name: "dead-code", template: DEAD_CODE_SKILL },
  { name: "dependency-update", template: DEPENDENCY_UPDATE_SKILL },
];

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
  test("has start field", () => {
    expect(SCHEDULE_CONTENT).toContain("start:");
  });

  test("has end field", () => {
    expect(SCHEDULE_CONTENT).toContain("end:");
  });
});

describe("invariants template", () => {
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
