import { describe, test, expect } from "bun:test";
import { parseSkillFile, loadSkills, findSkillForType, type SkillDefinition } from "../skills/registry";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("parseSkillFile", () => {
  test("parses a valid skill file", () => {
    const content = `---
name: fix-tests
description: Fix failing tests.
maps-to: fix
risk: low
---

## Instructions

Run tests and fix them.`;

    const skill = parseSkillFile(content);
    expect(skill.name).toBe("fix-tests");
    expect(skill.description).toBe("Fix failing tests.");
    expect(skill.mapsTo).toBe("fix");
    expect(skill.risk).toBe("low");
    expect(skill.prompt).toContain("Run tests and fix them.");
    expect(skill.body).toContain("## Instructions");
  });

  test("throws on missing frontmatter", () => {
    expect(() => parseSkillFile("No frontmatter here")).toThrow("must have YAML frontmatter");
  });

  test("throws on missing name", () => {
    const content = `---
description: Something
maps-to: fix
risk: low
---
Body`;
    expect(() => parseSkillFile(content)).toThrow("missing 'name'");
  });

  test("throws on missing maps-to", () => {
    const content = `---
name: test
description: Something
risk: low
---
Body`;
    expect(() => parseSkillFile(content)).toThrow("missing 'maps-to'");
  });

  test("throws on invalid risk level", () => {
    const content = `---
name: test
description: Something
maps-to: fix
risk: extreme
---
Body`;
    expect(() => parseSkillFile(content)).toThrow("invalid 'risk'");
  });
});

describe("loadSkills", () => {
  let tmpDir: string;

  test("returns empty map when skills directory doesn't exist", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "registry-test-"));
    const skills = await loadSkills(tmpDir);
    expect(skills.size).toBe(0);
    await rm(tmpDir, { recursive: true });
  });

  test("loads skill files from directory", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "registry-test-"));
    const skillsDir = join(tmpDir, ".shoe-makers", "skills");
    await mkdir(skillsDir, { recursive: true });

    await writeFile(
      join(skillsDir, "fix-tests.md"),
      `---
name: fix-tests
description: Fix failing tests.
maps-to: fix
risk: low
---

Fix the tests.`,
    );

    await writeFile(
      join(skillsDir, "implement.md"),
      `---
name: implement
description: Implement a feature.
maps-to: implement
risk: medium
---

Build it.`,
    );

    // Non-md file should be ignored
    await writeFile(join(skillsDir, "notes.txt"), "not a skill");

    const skills = await loadSkills(tmpDir);
    expect(skills.size).toBe(2);
    expect(skills.get("fix-tests")?.mapsTo).toBe("fix");
    expect(skills.get("implement")?.risk).toBe("medium");

    await rm(tmpDir, { recursive: true });
  });

  test("filters by enabledSkills when provided", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "registry-test-"));
    const skillsDir = join(tmpDir, ".shoe-makers", "skills");
    await mkdir(skillsDir, { recursive: true });

    await writeFile(
      join(skillsDir, "fix-tests.md"),
      `---\nname: fix-tests\ndescription: Fix tests.\nmaps-to: fix\nrisk: low\n---\nFix.`,
    );
    await writeFile(
      join(skillsDir, "implement.md"),
      `---\nname: implement\ndescription: Implement.\nmaps-to: implement\nrisk: medium\n---\nBuild.`,
    );
    await writeFile(
      join(skillsDir, "health.md"),
      `---\nname: health\ndescription: Health.\nmaps-to: health\nrisk: low\n---\nImprove.`,
    );

    // Only enable fix-tests and health
    const skills = await loadSkills(tmpDir, ["fix-tests", "health"]);
    expect(skills.size).toBe(2);
    expect(skills.has("fix-tests")).toBe(true);
    expect(skills.has("health")).toBe(true);
    expect(skills.has("implement")).toBe(false);

    await rm(tmpDir, { recursive: true });
  });

  test("loads all skills when enabledSkills is null", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "registry-test-"));
    const skillsDir = join(tmpDir, ".shoe-makers", "skills");
    await mkdir(skillsDir, { recursive: true });

    await writeFile(
      join(skillsDir, "fix-tests.md"),
      `---\nname: fix-tests\ndescription: Fix tests.\nmaps-to: fix\nrisk: low\n---\nFix.`,
    );
    await writeFile(
      join(skillsDir, "implement.md"),
      `---\nname: implement\ndescription: Implement.\nmaps-to: implement\nrisk: medium\n---\nBuild.`,
    );

    const skills = await loadSkills(tmpDir, null);
    expect(skills.size).toBe(2);

    await rm(tmpDir, { recursive: true });
  });

  test("loads no skills when enabledSkills is empty array", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "registry-test-"));
    const skillsDir = join(tmpDir, ".shoe-makers", "skills");
    await mkdir(skillsDir, { recursive: true });

    await writeFile(
      join(skillsDir, "fix-tests.md"),
      `---\nname: fix-tests\ndescription: Fix tests.\nmaps-to: fix\nrisk: low\n---\nFix.`,
    );

    const skills = await loadSkills(tmpDir, []);
    expect(skills.size).toBe(0);

    await rm(tmpDir, { recursive: true });
  });
});

describe("parseOffLimits", () => {
  test("extracts off-limits items from skill body", () => {
    const content = `---
name: implement
description: Implement a feature.
maps-to: implement
risk: medium
---

## Instructions

Build things.

## Off-limits

- Do not change the behaviour tree routing logic without updating the wiki
- Do not modify unrelated modules
- Do not add external dependencies without justification`;

    const skill = parseSkillFile(content);
    expect(skill.offLimits).toEqual([
      "Do not change the behaviour tree routing logic without updating the wiki",
      "Do not modify unrelated modules",
      "Do not add external dependencies without justification",
    ]);
  });

  test("returns empty array when no off-limits section", () => {
    const content = `---
name: fix-tests
description: Fix tests
maps-to: fix
risk: low
---

## Instructions

Fix things.`;

    const skill = parseSkillFile(content);
    expect(skill.offLimits).toEqual([]);
  });
});

describe("findSkillForType", () => {
  const skills = new Map<string, SkillDefinition>([
    ["fix-tests", { name: "fix-tests", description: "Fix tests", prompt: "", risk: "low", mapsTo: "fix", body: "", offLimits: [] }],
    ["implement", { name: "implement", description: "Implement", prompt: "", risk: "medium", mapsTo: "implement", body: "", offLimits: [] }],
  ]);

  test("finds skill by priority type", () => {
    const skill = findSkillForType(skills, "fix");
    expect(skill?.name).toBe("fix-tests");
  });

  test("returns undefined for unknown type", () => {
    const skill = findSkillForType(skills, "unknown");
    expect(skill).toBeUndefined();
  });
});
