import { describe, test, expect } from "bun:test";
import { generatePrompt, ACTION_TO_SKILL_TYPE, parseActionTypeFromPrompt } from "../prompts";
import type { ActionType } from "../types";
import { loadSkills } from "../skills/registry";
import { makeState, allActions, expectPromptContains, makeSkillMap, makeSkill } from "./prompts-test-helpers";

describe("generatePrompt", () => {
  test("all actions mention invariants.md is off-limits", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      expect(prompt).toContain("invariants.md");
      expect(prompt).toContain("Off-limits");
    }
  });

  const promptCases: [string, ActionType, string[]][] = [
    ["fix-critique prompt tells elf to read critique findings", "fix-critique", [".shoe-makers/findings/", "critique-"]],
    ["fix-critique prompt tells elf to mark critiques as resolved", "fix-critique", ["## Status", "Resolved."]],
    ["fix-critique prompt tells elf NOT to delete critique files", "fix-critique", ["Do NOT delete the critique files"]],
    ["fix-critique prompt tells elf to run bun test", "fix-critique", ["bun test"]],
    ["review prompt tells elf to run git diff", "review", ["git diff"]],
    ["review prompt checks correctness, tests, and spec alignment", "review", ["correctly implement", "tests for the changes", "wiki spec"]],
    ["review prompt tells elf to commit if good or fix if not", "review", ["commit them", "fix the issues"]],
    ["critique prompt restricts reviewer to findings only", "critique", ["only write findings"]],
    ["continue-work prompt tells elf to read partial-work.md", "continue-work", ["partial-work.md"]],
    ["continue-work prompt tells elf to delete partial-work.md when done", "continue-work", ["delete", "partial-work.md"]],
    ["continue-work prompt tells elf to run bun test", "continue-work", ["bun test"]],
    ["execute-work-item prompt tells elf to read work-item.md", "execute-work-item", ["work-item.md", "Delete"]],
    ["prioritise prompt tells elf to read candidates and write work-item", "prioritise", ["candidates.md", "work-item.md", "Delete"]],
    ["prioritise prompt mentions skill-type metadata", "prioritise", ["skill-type:"]],
    ["prioritise prompt asks for decision rationale", "prioritise", ["Decision Rationale"]],
    ["explore prompt tells elf to write candidates.md", "explore", ["candidates.md", "ranked"]],
    ["explore prompt mentions README accuracy check", "explore", ["README.md", "accurately"]],
    ["explore prompt mentions writing insights", "explore", [".shoe-makers/insights/", "proposals, not problems"]],
    ["explore prompt mentions suggesting new invariants", "explore", ["suggesting a new invariant"]],
    ["execute prompt mentions never reverting the wiki", "execute-work-item", ["never revert the wiki", "source of truth"]],
    ["dead-code prompt tells elf to read work-item.md", "dead-code", ["work-item.md"]],
    ["dead-code prompt tells elf to verify with grep", "dead-code", ["grep"]],
    ["dead-code prompt permits deleting test files", "dead-code", ["You ARE permitted to delete test files"]],
    ["dead-code prompt tells elf to run bun test", "dead-code", ["bun test"]],
  ];

  for (const [label, action, contains] of promptCases) {
    test(label, () => {
      expectPromptContains(action, makeState(), contains);
    });
  }

  test("inbox prompt includes message count from state", () => {
    const state = makeState();
    state.inboxCount = 5;
    const prompt = generatePrompt("inbox", state);
    expect(prompt).toContain("5 message(s)");
  });

  test("critique prompt tells reviewer to update marker AFTER committing", () => {
    const prompt = generatePrompt("critique", makeState());
    const commitStep = prompt.indexOf("Commit your critique");
    const markerStep = prompt.indexOf("Update `.shoe-makers/state/last-reviewed-commit`");
    expect(commitStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(-1);
    expect(markerStep).toBeGreaterThan(commitStep);
  });

  test("each action returns a non-empty prompt", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      expect(prompt.length).toBeGreaterThan(50);
    }
  });
});

describe("generatePrompt includes skill content for work actions", () => {
  const implementSkill = makeSkill({
    name: "implement",
    mapsTo: "implement",
    body: "## When to apply\n\nSpec has gaps.\n\n## Instructions\n\n1. Read the wiki\n2. Write code\n3. Write tests\n\n## Verification criteria\n\n- Tests pass\n- Code matches spec",
  });

  const fixTestsSkill = makeSkill({
    name: "fix-tests",
    mapsTo: "fix",
    body: "## Instructions\n\nRun bun test, read failures, fix them.\n\n## Verification criteria\n\n- All tests pass",
  });

  const skills = makeSkillMap(implementSkill, fixTestsSkill);

  test("fix-tests prompt includes fix-tests skill body", () => {
    expectPromptContains("fix-tests", makeState(), ["Run bun test, read failures, fix them", "All tests pass"], [], skills);
  });

  test("execute-work-item prompt includes implement skill body", () => {
    expectPromptContains("execute-work-item", makeState(), ["Read the wiki", "Verification criteria"], [], skills);
  });

  test("skill content is in a clearly marked section", () => {
    expectPromptContains("execute-work-item", makeState(), ["## Skill: implement"], [], skills);
  });

  test("dead-code prompt includes dead-code skill body when provided", () => {
    const deadCodeSkill = makeSkill({
      name: "dead-code",
      mapsTo: "dead-code",
      body: "## Instructions\n\nFind and remove unused exports.\n\n## Verification criteria\n\n- No import errors",
    });
    const skillsWithDeadCode = makeSkillMap(implementSkill, fixTestsSkill, deadCodeSkill);
    const prompt = generatePrompt("dead-code", makeState(), skillsWithDeadCode);
    expect(prompt).toContain("## Skill: dead-code");
    expect(prompt).toContain("Find and remove unused exports");
  });

  test("non-work actions ignore skills (critique, review, explore)", () => {
    expectPromptContains("critique", makeState(), [], ["## Skill:"], skills);
  });
});

describe("ACTION_TO_SKILL_TYPE matches real skill files", () => {
  test("every mapped skill type has a matching skill file on disk", async () => {
    const skills = await loadSkills(process.cwd());
    const skillMapsToValues = new Set(
      [...skills.values()].map((s) => s.mapsTo)
    );

    for (const [action, skillType] of Object.entries(ACTION_TO_SKILL_TYPE)) {
      if (skillType === undefined) continue;
      expect(skillMapsToValues).toContain(skillType);
    }
  });

  test("work actions produce prompts with real skill content from disk", async () => {
    const skills = await loadSkills(process.cwd());
    const state = makeState();

    for (const [action, skillType] of Object.entries(ACTION_TO_SKILL_TYPE)) {
      if (skillType === undefined) continue;
      const prompt = generatePrompt(action as ActionType, state, skills);
      expect(prompt).toContain("## Skill:");
    }
  });
});

describe("parseActionTypeFromPrompt", () => {
  const cases: [string, ActionType][] = [
    ["# Fix Failing Tests\n\nSome prompt text", "fix-tests"],
    ["# Fix Unresolved Critiques\n\nMore text", "fix-critique"],
    ["# Adversarial Review — Critique Previous Elf's Work\n\nText", "critique"],
    ["# Continue Partial Work\n\nText", "continue-work"],
    ["# Review Uncommitted Work\n\nText", "review"],
    ["# Inbox Messages — Act on These First\n\nText", "inbox"],
    ["# Execute Work Item\n\nText", "execute-work-item"],
    ["# Remove Dead Code\n\nText", "dead-code"],
    ["# Prioritise — Pick a Work Item\n\nText", "prioritise"],
    ["# Innovate — Creative Insight from Random Conceptual Collision\n\nText", "innovate"],
    ["# Evaluate Insight — Build on Creative Ideas\n\nText", "evaluate-insight"],
    ["# Explore — Survey and Write Candidates\n\nText", "explore"],
  ];

  for (const [prompt, expected] of cases) {
    test(`parses "${expected}" from prompt title`, () => {
      expect(parseActionTypeFromPrompt(prompt)).toBe(expected);
    });
  }

  test("returns null for unrecognised title", () => {
    expect(parseActionTypeFromPrompt("# Unknown Action\n\nText")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseActionTypeFromPrompt("")).toBeNull();
  });

  test("round-trip: generatePrompt then parseActionTypeFromPrompt for all actions", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      const parsed = parseActionTypeFromPrompt(prompt);
      expect(parsed).toBe(action);
    }
  });
});

describe("generatePrompt exhaustiveness", () => {
  test("returns non-empty prompt with heading for all action types", () => {
    const state = makeState();
    for (const action of allActions) {
      const prompt = generatePrompt(action, state);
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain("#");
    }
  });
});
