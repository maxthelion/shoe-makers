import { describe, test, expect } from "bun:test";
import { SETUP_HOUSEKEEPING_PATHS, ALL_HOUSEKEEPING_PATHS } from "../utils/housekeeping";

describe("housekeeping path constants", () => {
  test("ALL_HOUSEKEEPING_PATHS is a superset of SETUP_HOUSEKEEPING_PATHS", () => {
    for (const path of SETUP_HOUSEKEEPING_PATHS) {
      expect(ALL_HOUSEKEEPING_PATHS).toContain(path);
    }
  });

  test("ALL_HOUSEKEEPING_PATHS includes .shoe-makers/state/", () => {
    expect(ALL_HOUSEKEEPING_PATHS).toContain(".shoe-makers/state/");
  });

  test("SETUP_HOUSEKEEPING_PATHS does NOT include .shoe-makers/state/", () => {
    expect(SETUP_HOUSEKEEPING_PATHS).not.toContain(".shoe-makers/state/");
  });

  test("both include core housekeeping paths", () => {
    const corePaths = [".shoe-makers/findings/", ".shoe-makers/log/", ".shoe-makers/archive/"];
    for (const path of corePaths) {
      expect(SETUP_HOUSEKEEPING_PATHS).toContain(path);
      expect(ALL_HOUSEKEEPING_PATHS).toContain(path);
    }
  });
});
