import { describe, test, expect } from "bun:test";
import {
  determineTier,
  isInnovationTier,
  formatTopGaps,
  formatCodebaseSnapshot,
  parseActionTypeFromPrompt,
  findSkillForAction,
  formatSkillCatalog,
  formatSkillSection,
} from "../prompts/helpers";
import type { SkillDefinition } from "../skills/registry";
import { makeAssessment } from "./test-utils";

describe("determineTier", () => {
  test("returns no gaps when assessment is null", () => {
    const tier = determineTier(null);
    expect(tier.hasGaps).toBe(false);
    expect(tier.specOnlyCount).toBe(0);
    expect(tier.untestedCount).toBe(0);
  });

  test("returns no gaps when all counts are zero", () => {
    const assessment = makeAssessment();
    const tier = determineTier(assessment);
    expect(tier.hasGaps).toBe(false);
  });

  test("detects gaps when specifiedOnly > 0", () => {
    const assessment = makeAssessment({ specifiedOnly: 3 });
    const tier = determineTier(assessment);
    expect(tier.hasGaps).toBe(true);
    expect(tier.specOnlyCount).toBe(3);
  });

  test("detects gaps when implementedUntested >= 5", () => {
    const assessment = makeAssessment({ implementedUntested: 5 });
    const tier = determineTier(assessment);
    expect(tier.hasGaps).toBe(true);
    expect(tier.untestedCount).toBe(5);
  });

  test("no gaps when implementedUntested < 5", () => {
    const assessment = makeAssessment({ implementedUntested: 4 });
    const tier = determineTier(assessment);
    expect(tier.hasGaps).toBe(false);
  });

  test("returns no gaps when invariants is null", () => {
    const assessment = makeAssessment({}, { invariants: null });
    const tier = determineTier(assessment);
    expect(tier).toEqual({ hasGaps: false, specOnlyCount: 0, untestedCount: 0 });
  });

  test("both non-zero means hasGaps", () => {
    const assessment = makeAssessment({ specifiedOnly: 3, implementedUntested: 10 });
    const tier = determineTier(assessment);
    expect(tier.hasGaps).toBe(true);
    expect(tier.specOnlyCount).toBe(3);
    expect(tier.untestedCount).toBe(10);
  });
});

describe("isInnovationTier", () => {
  test("returns false when no assessment", () => {
    expect(isInnovationTier(null)).toBe(false);
  });

  test("returns false when gaps exist", () => {
    const assessment = makeAssessment({ specifiedOnly: 2 });
    expect(isInnovationTier(assessment)).toBe(false);
  });

  test("returns true when no gaps", () => {
    const assessment = makeAssessment();
    expect(isInnovationTier(assessment)).toBe(true);
  });

  test("4 untested claims allows innovation tier (below threshold)", () => {
    const assessment = makeAssessment({ implementedUntested: 4 });
    expect(isInnovationTier(assessment)).toBe(true);
  });

  test("5 untested claims blocks innovation tier (at threshold)", () => {
    const assessment = makeAssessment({ implementedUntested: 5 });
    expect(isInnovationTier(assessment)).toBe(false);
  });
});

describe("formatTopGaps", () => {
  test("returns empty string when no assessment", () => {
    expect(formatTopGaps(null)).toBe("");
  });

  test("returns empty string when no gaps", () => {
    const assessment = makeAssessment();
    expect(formatTopGaps(assessment)).toBe("");
  });

  test("formats gaps as bullet list", () => {
    const assessment = makeAssessment({
      specifiedOnly: 1,
      topSpecGaps: [{ id: "feat-x", description: "Missing feature X", group: "architecture" }],
    });
    const result = formatTopGaps(assessment);
    expect(result).toContain("- Missing feature X (architecture)");
  });

  test("limits to 5 gaps", () => {
    const gaps = Array.from({ length: 8 }, (_, i) => ({ id: `gap-${i}`, description: `Gap ${i}`, group: "test" }));
    const assessment = makeAssessment({ specifiedOnly: 8, topSpecGaps: gaps });
    const result = formatTopGaps(assessment);
    expect(result).toContain("Gap 4");
    expect(result).not.toContain("Gap 5");
  });
});

describe("formatCodebaseSnapshot", () => {
  test("returns empty string when no assessment", () => {
    expect(formatCodebaseSnapshot(null)).toBe("");
  });

  test("formats health, worst files, and findings", () => {
    const assessment = makeAssessment({}, {
      findings: [{ id: "f", content: "finding" }],
      worstFiles: [{ path: "src/big.ts", score: 40 }],
      healthScore: 75,
      invariants: null,
    });
    const result = formatCodebaseSnapshot(assessment);
    expect(result).toContain("Health: 75/100");
    expect(result).toContain("src/big.ts (40)");
    expect(result).toContain("Open findings: 1");
  });

  test("shows unknown health when null", () => {
    const assessment = makeAssessment({}, { healthScore: null });
    const result = formatCodebaseSnapshot(assessment);
    expect(result).toContain("Health: unknown");
  });

  test("shows 'none' for no worst files", () => {
    const assessment = {
      testsPass: true,
      openPlans: [],
      findings: [],
      worstFiles: [],
      healthScore: 40,
      invariants: null,
    } as any;
    const result = formatCodebaseSnapshot(assessment);
    expect(result).toContain("Worst files: none");
  });
});

describe("parseActionTypeFromPrompt", () => {
  test("parses Fix Failing Tests", () => {
    expect(parseActionTypeFromPrompt("# Fix Failing Tests\n\nBody.")).toBe("fix-tests");
  });

  test("parses Adversarial Review", () => {
    expect(parseActionTypeFromPrompt("# Adversarial Review — Critique\n")).toBe("critique");
  });

  test("parses Execute Work Item", () => {
    expect(parseActionTypeFromPrompt("# Execute Work Item\n")).toBe("execute-work-item");
  });

  test("parses Explore", () => {
    expect(parseActionTypeFromPrompt("# Explore — Survey\n")).toBe("explore");
  });

  test("parses Innovate", () => {
    expect(parseActionTypeFromPrompt("# Innovate — Creative Brief\n")).toBe("innovate");
  });

  test("parses Evaluate Insight", () => {
    expect(parseActionTypeFromPrompt("# Evaluate Insight — Build on Ideas\n")).toBe("evaluate-insight");
  });

  test("returns null for unknown title", () => {
    expect(parseActionTypeFromPrompt("# Unknown Action\n")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseActionTypeFromPrompt("")).toBeNull();
  });
});

describe("findSkillForAction", () => {
  const skills = new Map<string, SkillDefinition>([
    ["impl", { name: "implement", filename: "implement.md", mapsTo: "implement", description: "Implement", body: "", prompt: "", risk: "low" as const, offLimits: [], validationPatterns: [] }],
    ["fix", { name: "fix-tests", filename: "fix.md", mapsTo: "fix", description: "Fix", body: "", prompt: "", risk: "low" as const, offLimits: [], validationPatterns: [] }],
  ]);

  test("returns undefined when no skills map", () => {
    expect(findSkillForAction("fix-tests")).toBeUndefined();
  });

  test("returns undefined when empty skills map", () => {
    expect(findSkillForAction("fix-tests", new Map())).toBeUndefined();
  });

  test("returns matching skill", () => {
    const result = findSkillForAction("fix-tests", skills);
    expect(result?.name).toBe("fix-tests");
  });

  test("returns undefined for action with no skill mapping", () => {
    const result = findSkillForAction("critique", skills);
    expect(result).toBeUndefined();
  });

  test("finds skill for execute-work-item via implement mapping", () => {
    const skill = findSkillForAction("execute-work-item", skills);
    expect(skill).toBeDefined();
    expect(skill!.name).toBe("implement");
  });

  test("returns undefined when mapped skill type not in map", () => {
    const partialSkills = new Map<string, SkillDefinition>([
      ["impl", { name: "implement", filename: "implement.md", mapsTo: "implement", description: "Implement", body: "", prompt: "", risk: "low" as const, offLimits: [] }],
    ]);
    expect(findSkillForAction("fix-tests", partialSkills)).toBeUndefined();
  });
});

describe("formatSkillCatalog", () => {
  test("returns empty string when no skills", () => {
    expect(formatSkillCatalog()).toBe("");
    expect(formatSkillCatalog(new Map())).toBe("");
  });

  test("formats skills as bullet list", () => {
    const skills = new Map<string, SkillDefinition>([
      ["impl", { name: "implement", filename: "implement.md", mapsTo: "implement", description: "Implement a feature", body: "", prompt: "", risk: "low" as const, offLimits: [], validationPatterns: [] }],
    ]);
    const result = formatSkillCatalog(skills);
    expect(result).toContain("**implement** (implement)");
    expect(result).toContain("Implement a feature");
  });
});

describe("formatSkillSection", () => {
  test("formats skill name and body", () => {
    const skill: SkillDefinition = {
      name: "implement",
      filename: "implement.md",
      mapsTo: "implement",
      description: "Implement a feature",
      body: "## When to apply\n\nWhen there are gaps.",
      prompt: "## When to apply\n\nWhen there are gaps.",
      risk: "low",
      offLimits: [],
      validationPatterns: [],
    };
    const result = formatSkillSection(skill);
    expect(result).toContain("## Skill: implement");
    expect(result).toContain("## When to apply");
  });
});
