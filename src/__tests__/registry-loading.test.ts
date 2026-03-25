import { describe, test, expect } from "bun:test";
import { loadSkills } from "../skills/registry";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

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
