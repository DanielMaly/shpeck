import { ShpeckError } from "./errors";
import { readTextFileIfExists, writeTextFile } from "./fs";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseToml<T>(text: string, context: string): T {
  try {
    return Bun.TOML.parse(text) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ShpeckError(`Invalid TOML (${context}): ${msg}`);
  }
}

export async function readTomlFile<T>(path: string): Promise<{ text: string; data: T } | null> {
  const text = await readTextFileIfExists(path);
  if (text === null) return null;
  return { text, data: parseToml<T>(text, path) };
}

// Updates a top-level TOML string key by editing the raw text (preserves comments/unknown keys).
export function upsertTopLevelTomlString(tomlText: string, key: string, value: string): string {
  const quoted = JSON.stringify(value);
  const keyRe = escapeRegExp(key);

  const lineRe = new RegExp(`^(\\s*)${keyRe}(\\s*=\\s*)(.*?)(\\s*(#.*)?)$`, "m");
  if (lineRe.test(tomlText)) {
    return tomlText.replace(lineRe, (_m, indent, eq, _rhs, trailing) => {
      return `${indent}${key}${eq}${quoted}${trailing ?? ""}`;
    });
  }

  const needsNewline = tomlText.length > 0 && !tomlText.endsWith("\n");
  const prefix = needsNewline ? "\n" : "";
  return `${tomlText}${prefix}${key} = ${quoted}\n`;
}

export async function writeTomlFile(path: string, tomlText: string): Promise<void> {
  await writeTextFile(path, tomlText);
}
