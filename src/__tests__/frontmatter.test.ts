import { describe, test, expect } from "bun:test";
import { parseFrontmatter, getFrontmatterField } from "../utils/frontmatter";

describe("parseFrontmatter", () => {
  test("parses standard frontmatter", () => {
    const content = `---\ntitle: Hello\ncategory: spec\n---\nBody text here.`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.frontmatter).toBe("title: Hello\ncategory: spec");
    expect(result!.body).toBe("Body text here.");
  });

  test("handles whitespace after opening delimiter", () => {
    const content = `---  \ntitle: Test\n---\nBody.`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.frontmatter).toBe("title: Test");
  });

  test("returns null when no frontmatter", () => {
    expect(parseFrontmatter("Just some text.")).toBeNull();
    expect(parseFrontmatter("")).toBeNull();
  });

  test("handles empty frontmatter", () => {
    const content = `---\n\n---\nBody.`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.frontmatter).toBe("");
    expect(result!.body).toBe("Body.");
  });

  test("extracts body after frontmatter", () => {
    const content = `---\ntitle: Test\n---\n\n# Heading\n\nParagraph.`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.body).toBe("# Heading\n\nParagraph.");
  });

  test("handles frontmatter with no body", () => {
    const content = `---\ntitle: Test\n---\n`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.frontmatter).toBe("title: Test");
    expect(result!.body).toBe("");
  });

  test("handles CRLF line endings", () => {
    const content = "---\r\ntitle: Hello\r\ncategory: spec\r\n---\r\nBody text.";
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.frontmatter).toBe("title: Hello\ncategory: spec");
    expect(result!.body).toBe("Body text.");
  });

  test("handles mixed LF and CRLF", () => {
    const content = "---\r\ntitle: Mixed\n---\nBody.";
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.frontmatter).toBe("title: Mixed");
  });
});

describe("getFrontmatterField", () => {
  test("extracts existing field", () => {
    const fm = "title: Hello World\ncategory: spec";
    expect(getFrontmatterField(fm, "title")).toBe("Hello World");
    expect(getFrontmatterField(fm, "category")).toBe("spec");
  });

  test("returns undefined for missing field", () => {
    expect(getFrontmatterField("title: Test", "category")).toBeUndefined();
  });

  test("trims whitespace from values", () => {
    expect(getFrontmatterField("title:   Spaced  ", "title")).toBe("Spaced");
  });

  test("handles fields with colons in values", () => {
    expect(getFrontmatterField("description: This: has colons", "description")).toBe("This: has colons");
  });

  test("strips double quotes from values", () => {
    expect(getFrontmatterField('title: "Hello World"', "title")).toBe("Hello World");
  });

  test("strips single quotes from values", () => {
    expect(getFrontmatterField("title: 'Hello World'", "title")).toBe("Hello World");
  });

  test("preserves unquoted values unchanged", () => {
    expect(getFrontmatterField("title: Hello World", "title")).toBe("Hello World");
  });
});
