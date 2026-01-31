import matter from "gray-matter";
import YAML from "yaml";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const MATTER_OPTIONS = {
  engines: {
    yaml: {
      parse: (s: string): object => {
        if (!s.trim()) return {};
        const v = YAML.parse(s) as unknown;
        return isPlainObject(v) ? v : {};
      },
      stringify: (o: object): string => YAML.stringify(o).trimEnd(),
    },
  },
} as const;

export function parseMarkdownWithFrontmatter(markdown: string): {
  data: Record<string, unknown>;
  content: string;
  hasFrontmatter: boolean;
} {
  const parsed = matter(markdown, MATTER_OPTIONS);

  const data = isPlainObject(parsed.data) ? parsed.data : {};
  return {
    data,
    content: parsed.content,
    hasFrontmatter: Boolean(parsed.matter),
  };
}

export function applyFrontmatter(
  markdown: string,
  toolFrontmatter: Record<string, unknown> | null | undefined
): string {
  const { data, content } = parseMarkdownWithFrontmatter(markdown);
  const overrides = toolFrontmatter && isPlainObject(toolFrontmatter) ? toolFrontmatter : {};
  const merged = { ...data, ...overrides };

  if (Object.keys(merged).length === 0) return content;
  return matter.stringify(content, merged, MATTER_OPTIONS);
}
