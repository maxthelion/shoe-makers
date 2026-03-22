import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/**
 * Write a wiki page with frontmatter to a temp dir.
 */
export async function writeWikiPage(
  tempDir: string,
  name: string,
  title: string,
  category: string,
  body: string = ""
): Promise<void> {
  const dir = join(tempDir, "wiki", "pages");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${name}.md`),
    `---\ntitle: ${title}\ncategory: ${category}\n---\n# ${title}\n${body}`
  );
}

/**
 * Write a source file under src/ in a temp dir.
 */
export async function writeSourceFile(
  tempDir: string,
  path: string,
  content: string = "// source\n"
): Promise<void> {
  const fullPath = join(tempDir, "src", path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content);
}

/**
 * Write a test file under src/ in a temp dir.
 */
export async function writeTestFile(
  tempDir: string,
  path: string,
  content: string = "// test\n"
): Promise<void> {
  const fullPath = join(tempDir, "src", path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content);
}

/**
 * Write a claim-evidence.yaml file in a temp dir.
 */
export async function writeClaimEvidence(
  tempDir: string,
  yaml: string
): Promise<void> {
  const dir = join(tempDir, ".shoe-makers");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "claim-evidence.yaml"), yaml);
}
