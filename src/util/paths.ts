import { dirname, relative } from "node:path";

/**
 * Compute a TypeScript import specifier from one project-relative file to
 * another — e.g. from `src/models/todo.ts` to `src/lib/fireclass.ts` gives
 * `../lib/fireclass`. Drops the extension, uses POSIX separators, and ensures a
 * leading `./` for same-directory imports.
 */
export function relativeImport(fromFile: string, toFile: string): string {
  let rel = relative(dirname(fromFile), toFile);
  rel = rel.split("\\").join("/"); // normalize Windows separators
  rel = rel.replace(/\.tsx?$/, ""); // drop .ts / .tsx
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

/** PascalCase a raw model name (e.g. "user-profile" -> "UserProfile"). */
export function toPascalCase(name: string): string {
  return name
    .replace(/[_\-\s]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** kebab/lower file base for a model (e.g. "UserProfile" -> "user-profile"). */
export function toFileBase(name: string): string {
  return toPascalCase(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/** Naive collection name from a model name (e.g. "User" -> "users"). */
export function toCollectionName(name: string): string {
  const base = toPascalCase(name).toLowerCase();
  if (base.endsWith("s")) return base;
  if (base.endsWith("y")) return `${base.slice(0, -1)}ies`;
  return `${base}s`;
}
