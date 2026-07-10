import { join } from "node:path";
import * as p from "@clack/prompts";
import type { FireclassConfig } from "../config";
import { readConfig } from "../config";
import { findProjectRoot } from "../detect";
import { modelTemplate } from "../templates";
import { exists, writeFile } from "../util/fs";
import {
  relativeImport,
  toCollectionName,
  toFileBase,
  toPascalCase,
} from "../util/paths";

export interface ModelOptions {
  collection?: string;
  dir?: string;
  force?: boolean;
  cwd?: string;
}

export interface CreatedModel {
  className: string;
  collection: string;
  /** Project-relative path of the created file. */
  path: string;
}

export class ModelExistsError extends Error {
  constructor(readonly path: string) {
    super(`Model already exists at ${path} (use --force to overwrite).`);
  }
}

/**
 * Create a minimal model file (only a `createdAt` field) under the models
 * directory. `BaseModel` comes from the configured app binding while
 * `Collection` comes directly from the configured SDK package. Pure and
 * testable. Throws {@link ModelExistsError} unless `force`.
 */
export function createModelFile(
  root: string,
  config: FireclassConfig,
  name: string,
  options: ModelOptions = {},
): CreatedModel {
  const className = toPascalCase(name);
  const fileBase = toFileBase(name);
  const dir = options.dir ?? config.models.dir;
  const rel = join(dir, `${fileBase}.ts`);
  const abs = join(root, rel);
  const collection = options.collection ?? toCollectionName(name);

  if (exists(abs) && !options.force) {
    throw new ModelExistsError(rel);
  }

  const importPath = relativeImport(rel, config.fireclass.path);
  const runtimeImport =
    config.framework === "express" ? `${importPath}.js` : importPath;
  writeFile(abs, modelTemplate(name, collection, runtimeImport, config.package));

  return { className, collection, path: rel };
}

export async function runModel(
  name: string | undefined,
  options: ModelOptions = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const root = findProjectRoot(cwd);
  if (!root) {
    p.cancel("No package.json found.");
    process.exitCode = 1;
    return;
  }

  const config = readConfig(root);
  if (!config) {
    p.cancel("Fireclass is not configured here. Run `fireclass init` first.");
    process.exitCode = 1;
    return;
  }

  if (!name || !name.trim()) {
    p.cancel("Usage: fireclass model <Name>");
    process.exitCode = 1;
    return;
  }

  try {
    const created = createModelFile(root, config, name, options);
    p.log.success(
      `Created ${created.className} → ${created.path} (collection "${created.collection}")`,
    );
  } catch (err) {
    if (err instanceof ModelExistsError) {
      p.log.warn(err.message);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}
