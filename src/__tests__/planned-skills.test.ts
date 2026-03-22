import { describe, test, expect } from "bun:test";
import { loadSkills, parseSkillFile } from "../skills/registry";

describe("planned skill definitions", () => {
  test("octoclean-fix skill exists and is parseable", async () => {
    const skills = await loadSkills(".");
    const skill = skills.get("octoclean-fix");
    expect(skill).toBeDefined();
    expect(skill!.mapsTo).toBe("octoclean-fix");
    expect(skill!.description).toContain("octoclean");
  });

  test("bug-fix skill exists and is parseable", async () => {
    const skills = await loadSkills(".");
    const skill = skills.get("bug-fix");
    expect(skill).toBeDefined();
    expect(skill!.mapsTo).toBe("bug-fix");
  });

  test("dead-code skill exists and is parseable", async () => {
    const skills = await loadSkills(".");
    const skill = skills.get("dead-code");
    expect(skill).toBeDefined();
    expect(skill!.mapsTo).toBe("dead-code");
    expect(skill!.body).toContain("dead");
  });

  test("no two skills share the same maps-to value", async () => {
    const skills = await loadSkills(".");
    const mapsToValues = new Map<string, string>();
    for (const [name, skill] of skills) {
      const existing = mapsToValues.get(skill.mapsTo);
      if (existing) {
        throw new Error(
          `Skills "${existing}" and "${name}" both map to "${skill.mapsTo}" — findSkillForType will return non-deterministic results`
        );
      }
      mapsToValues.set(skill.mapsTo, name);
    }
  });

  test("all planned skills have off-limits sections", async () => {
    const skills = await loadSkills(".");
    for (const name of ["octoclean-fix", "bug-fix", "dead-code"]) {
      const skill = skills.get(name);
      expect(skill).toBeDefined();
      expect(skill!.offLimits.length).toBeGreaterThan(0);
    }
  });
});
