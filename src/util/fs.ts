import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

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

interface TsconfigShape {
  compilerOptions?: {
    experimentalDecorators?: boolean;
    emitDecoratorMetadata?: boolean;
  };
  include?: unknown[];
  references?: { path?: string }[];
}

function parseTsconfig(file: string): TsconfigShape | null {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as TsconfigShape;
  } catch {
    return null; // jsonc (comments/trailing commas)
  }
}

function includesSrc(cfg: TsconfigShape | null): boolean {
  return (
    !!cfg &&
    Array.isArray(cfg.include) &&
    cfg.include.some((i) => String(i).includes("src"))
  );
}

/**
 * The tsconfig file(s) that actually compile the app's `src` — so decorator
 * flags land where TypeScript uses them. Handles the Vite split-config layout
 * (`tsconfig.json` → references → `tsconfig.app.json`) as well as a single
 * `tsconfig.json`.
 */
function resolveTsconfigTargets(root: string): string[] {
  const rootPath = join(root, "tsconfig.json");
  const rootCfg = parseTsconfig(rootPath);
  const targets: string[] = [];

  for (const ref of rootCfg?.references ?? []) {
    if (!ref?.path) continue;
    let refPath = resolve(root, ref.path);
    if (existsSync(refPath) && !refPath.endsWith(".json")) {
      refPath = join(refPath, "tsconfig.json");
    }
    const refCfg = parseTsconfig(refPath);
    // The app config (compiles src) — e.g. tsconfig.app.json.
    if (
      (refCfg && includesSrc(refCfg)) ||
      basename(refPath) === "tsconfig.app.json"
    ) {
      targets.push(refPath);
    }
  }

  // Fall back to the root when it carries the src compilerOptions itself
  // (single-file layout) or when no referenced src config was found.
  const rootHasOptions = !!rootCfg && rootCfg.compilerOptions !== undefined;
  const noRefs = (rootCfg?.references?.length ?? 0) === 0;
  if ((rootHasOptions && (includesSrc(rootCfg) || noRefs)) || targets.length === 0) {
    targets.push(rootPath);
  }

  return [...new Set(targets)];
}

function hasDecoratorFlags(raw: string): boolean {
  return (
    /"experimentalDecorators"\s*:\s*true/.test(raw) &&
    /"emitDecoratorMetadata"\s*:\s*true/.test(raw)
  );
}

/** Patch one tsconfig file (JSON cleanly, or jsonc via comment-safe insert). */
function patchOneTsconfig(file: string): "patched" | "already" | "manual" {
  if (!existsSync(file)) return "manual";
  const raw = readFileSync(file, "utf8");
  if (hasDecoratorFlags(raw)) return "already";

  try {
    const cfg = JSON.parse(raw) as TsconfigShape;
    cfg.compilerOptions = {
      ...(cfg.compilerOptions ?? {}),
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    };
    writeFile(file, `${JSON.stringify(cfg, null, 2)}\n`);
    return "patched";
  } catch {
    // jsonc: insert the missing flags right after the compilerOptions brace,
    // preserving comments/formatting.
    const m = raw.match(/"compilerOptions"\s*:\s*\{/);
    if (!m || m.index === undefined) return "manual";
    const at = m.index + m[0].length;
    const inject: string[] = [];
    if (!/"experimentalDecorators"\s*:\s*true/.test(raw))
      inject.push('    "experimentalDecorators": true,');
    if (!/"emitDecoratorMetadata"\s*:\s*true/.test(raw))
      inject.push('    "emitDecoratorMetadata": true,');
    writeFile(file, raw.slice(0, at) + `\n${inject.join("\n")}` + raw.slice(at));
    return "patched";
  }
}

export type TsconfigPatchResult = "patched" | "already" | "manual" | "none";

/**
 * Ensure `experimentalDecorators` + `emitDecoratorMetadata` in the tsconfig(s)
 * that compile the app's src (following `references`). Returns "none" if there
 * is no tsconfig, "manual" if a target couldn't be safely edited.
 */
export function patchTsconfigDecorators(root: string): TsconfigPatchResult {
  if (!existsSync(join(root, "tsconfig.json"))) return "none";
  const targets = resolveTsconfigTargets(root);
  if (targets.length === 0) return "manual";

  let patched = false;
  let manual = false;
  let already = 0;
  for (const t of targets) {
    const r = patchOneTsconfig(t);
    if (r === "patched") patched = true;
    else if (r === "manual") manual = true;
    else already += 1;
  }
  if (patched) return "patched";
  if (manual) return "manual";
  if (already === targets.length) return "already";
  return "manual";
}

/** Read-only check of the decorator flags across the src tsconfig(s). */
export function tsconfigDecoratorStatus(
  root: string,
): "enabled" | "missing" | "manual" | "none" {
  if (!existsSync(join(root, "tsconfig.json"))) return "none";
  const targets = resolveTsconfigTargets(root);
  if (targets.length === 0) return "missing";
  for (const t of targets) {
    if (!existsSync(t)) return "missing";
    if (!hasDecoratorFlags(readFileSync(t, "utf8"))) return "missing";
  }
  return "enabled";
}
