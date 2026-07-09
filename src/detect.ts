import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Framework } from "./frameworks";

export type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
}

/** Walk up from `start` to the nearest directory containing package.json. */
export function findProjectRoot(start: string): string | null {
  let dir = start;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function readPackageJson(root: string): PackageJson | null {
  const path = join(root, "package.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as PackageJson;
  } catch {
    return null;
  }
}

/** All dependency names (deps + devDeps) declared in a package.json. */
function allDeps(pkg: PackageJson): Set<string> {
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
}

/**
 * Detect the framework from a package.json. Priority: next > express > react.
 * (Next projects also list react, so it must win over the bare-react check.)
 */
export function detectFramework(pkg: PackageJson): Framework | null {
  const deps = allDeps(pkg);
  if (deps.has("next")) return "next";
  if (deps.has("express")) return "express";
  if (deps.has("react") && deps.has("react-dom")) return "react";
  return null;
}

/** Detect the package manager from the `packageManager` field, lockfiles, or env. */
export function detectPackageManager(root: string): PackageManager | null {
  const pkg = readPackageJson(root);
  const field = pkg?.packageManager;
  if (field) {
    if (field.startsWith("pnpm")) return "pnpm";
    if (field.startsWith("yarn")) return "yarn";
    if (field.startsWith("bun")) return "bun";
    if (field.startsWith("npm")) return "npm";
  }

  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock")))
    return "bun";
  if (existsSync(join(root, "package-lock.json"))) return "npm";

  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";
  if (ua.startsWith("npm")) return "npm";

  return null;
}

/** Whether the project uses a `src/` directory (drives default paths). */
export function hasSrcLayout(root: string): boolean {
  return existsSync(join(root, "src"));
}

/** Default file/dir suggestions given the layout. */
export function defaultPaths(root: string) {
  const base = hasSrcLayout(root) ? "src" : ".";
  const p = (rest: string) => (base === "." ? rest : `${base}/${rest}`);
  return {
    firebase: p("lib/firebase.ts"),
    fireclass: p("lib/fireclass.ts"),
    models: p("models"),
  };
}
