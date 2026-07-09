import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

export function exists(path: string): boolean {
  return existsSync(path);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

/** Write a file, creating parent directories. */
export function writeFile(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf8");
}

/** Write only if the file does not already exist. Returns true if written. */
export function writeIfAbsent(path: string, content: string): boolean {
  if (existsSync(path)) return false;
  writeFile(path, content);
  return true;
}

/**
 * Ensure each key exists in a dotenv file, appending missing ones (never
 * overwriting existing values). Returns the keys that were added.
 */
export function ensureEnvKeys(
  envPath: string,
  keys: Record<string, string>,
): string[] {
  const current = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const present = new Set(
    current
      .split("\n")
      .map((l) => l.split("=")[0]?.trim())
      .filter(Boolean),
  );
  const added: string[] = [];
  let append = "";
  for (const [key, value] of Object.entries(keys)) {
    if (!present.has(key)) {
      append += `${key}=${value}\n`;
      added.push(key);
    }
  }
  if (append) {
    const prefix = current && !current.endsWith("\n") ? "\n" : "";
    writeFile(envPath, current + prefix + append);
  }
  return added;
}

/** Ensure a line exists in the project's .gitignore. Returns true if added. */
export function ensureGitignore(root: string, entry: string): boolean {
  const path = join(root, ".gitignore");
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = current.split("\n").map((l) => l.trim());
  if (lines.includes(entry)) return false;
  const prefix = current && !current.endsWith("\n") ? "\n" : "";
  writeFile(path, current + prefix + `${entry}\n`);
  return true;
}

/** Read-only check of the tsconfig decorator flags (for `doctor`). */
export function tsconfigDecoratorStatus(
  root: string,
): "enabled" | "missing" | "manual" | "none" {
  const path = join(root, "tsconfig.json");
  if (!existsSync(path)) return "none";
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      compilerOptions?: {
        experimentalDecorators?: boolean;
        emitDecoratorMetadata?: boolean;
      };
    };
    const o = parsed.compilerOptions ?? {};
    return o.experimentalDecorators && o.emitDecoratorMetadata
      ? "enabled"
      : "missing";
  } catch {
    return "manual";
  }
}

export type TsconfigPatchResult = "patched" | "already" | "manual" | "none";

/**
 * Ensure `experimentalDecorators` and `emitDecoratorMetadata` are enabled in
 * tsconfig.json. Returns:
 * - "none"    — no tsconfig.json
 * - "already" — both flags already set
 * - "patched" — flags added and written
 * - "manual"  — tsconfig has comments/trailing commas we won't rewrite; caller
 *               should tell the user to add the flags by hand
 */
export function patchTsconfigDecorators(root: string): TsconfigPatchResult {
  const path = join(root, "tsconfig.json");
  if (!existsSync(path)) return "none";
  const raw = readFileSync(path, "utf8");

  let parsed: {
    compilerOptions?: {
      experimentalDecorators?: boolean;
      emitDecoratorMetadata?: boolean;
    };
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "manual"; // jsonc with comments/trailing commas — don't risk it
  }

  const opts = parsed.compilerOptions ?? {};
  if (opts.experimentalDecorators && opts.emitDecoratorMetadata) return "already";

  parsed.compilerOptions = {
    ...opts,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  };
  writeFile(path, `${JSON.stringify(parsed, null, 2)}\n`);
  return "patched";
}
