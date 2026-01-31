import { ShpeckError } from "./errors";

export function parseJson<T>(text: string, context: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ShpeckError(`Invalid JSON (${context}): ${msg}`);
  }
}

export function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
