import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { fileExists } from "../utils/fs";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shoe-makers-fs-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("fileExists", () => {
  test("returns false for non-existent path", async () => {
    expect(await fileExists(join(tempDir, "nope.txt"))).toBe(false);
  });

  test("returns true for existing file", async () => {
    const p = join(tempDir, "exists.txt");
    await writeFile(p, "hello");
    expect(await fileExists(p)).toBe(true);
  });

  test("returns true for existing directory", async () => {
    const d = join(tempDir, "subdir");
    await mkdir(d);
    expect(await fileExists(d)).toBe(true);
  });
});
