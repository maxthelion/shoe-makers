import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { parseSchedule, isWithinWorkingHours, getShiftDate } from "../schedule";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-schedule-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("parseSchedule", () => {
  test("returns null when no schedule file exists", () => {
    expect(parseSchedule(tempDir)).toBeNull();
  });

  test("parses start and end hours from schedule.md", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 22\nend: 6\n"
    );

    const schedule = parseSchedule(tempDir);
    expect(schedule).toEqual({ start: 22, end: 6 });
  });

  test("returns null when schedule file has no start/end", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "some other content\n"
    );

    expect(parseSchedule(tempDir)).toBeNull();
  });
});

describe("isWithinWorkingHours", () => {
  test("returns true when no schedule file exists", () => {
    expect(isWithinWorkingHours(tempDir)).toBe(true);
  });

  test("returns true during overnight shift at 23:00", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 22\nend: 6\n"
    );
    const at23 = new Date("2026-03-22T23:00:00Z");
    expect(isWithinWorkingHours(tempDir, at23)).toBe(true);
  });

  test("returns true during overnight shift at 03:00 (after midnight)", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 22\nend: 6\n"
    );
    const at3 = new Date("2026-03-23T03:00:00Z");
    expect(isWithinWorkingHours(tempDir, at3)).toBe(true);
  });

  test("returns false outside overnight shift at 10:00", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 22\nend: 6\n"
    );
    const at10 = new Date("2026-03-22T10:00:00Z");
    expect(isWithinWorkingHours(tempDir, at10)).toBe(false);
  });

  test("returns true during daytime shift at 12:00", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 9\nend: 17\n"
    );
    const atNoon = new Date("2026-03-22T12:00:00Z");
    expect(isWithinWorkingHours(tempDir, atNoon)).toBe(true);
  });

  test("returns false outside daytime shift at 20:00", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 9\nend: 17\n"
    );
    const at20 = new Date("2026-03-22T20:00:00Z");
    expect(isWithinWorkingHours(tempDir, at20)).toBe(false);
  });

  test("returns true at exact start hour", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 9\nend: 17\n"
    );
    const at9 = new Date("2026-03-22T09:00:00Z");
    expect(isWithinWorkingHours(tempDir, at9)).toBe(true);
  });

  test("returns false at exact end hour", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 9\nend: 17\n"
    );
    const at17 = new Date("2026-03-22T17:00:00Z");
    expect(isWithinWorkingHours(tempDir, at17)).toBe(false);
  });

  test("no schedule means always within hours regardless of time", () => {
    const midnight = new Date("2026-03-22T00:00:00Z");
    expect(isWithinWorkingHours(tempDir, midnight)).toBe(true);
  });
});

describe("getShiftDate", () => {
  test("returns today's date when no schedule file", () => {
    const now = new Date("2026-03-22T14:00:00Z");
    const result = getShiftDate(tempDir, now);
    expect(result).toBe("2026-03-22");
  });

  test("returns today's date during overnight shift before midnight", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 22\nend: 6\n"
    );
    const at23 = new Date("2026-03-22T23:30:00Z");
    expect(getShiftDate(tempDir, at23)).toBe("2026-03-22");
  });

  test("returns yesterday's date during overnight shift after midnight", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 22\nend: 6\n"
    );
    const at3 = new Date("2026-03-23T03:00:00Z");
    expect(getShiftDate(tempDir, at3)).toBe("2026-03-22");
  });

  test("returns today's date during daytime shift", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 9\nend: 17\n"
    );
    const atNoon = new Date("2026-03-22T12:00:00Z");
    expect(getShiftDate(tempDir, atNoon)).toBe("2026-03-22");
  });

  test("returns today's date for daytime shift outside hours", async () => {
    await mkdir(join(tempDir, ".shoe-makers"), { recursive: true });
    await writeFile(
      join(tempDir, ".shoe-makers", "schedule.md"),
      "start: 9\nend: 17\n"
    );
    const at20 = new Date("2026-03-22T20:00:00Z");
    expect(getShiftDate(tempDir, at20)).toBe("2026-03-22");
  });
});
