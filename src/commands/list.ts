import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import type { FireclassConfig } from "../config";
import { readConfig } from "../config";
import { findProjectRoot } from "../detect";
import { exists } from "../util/fs";

export interface ModelEntry {
  file: string;
  className?: string;
  collection?: string;
}

/** Discover model files in the configured models directory. Pure and testable. */
export function listModels(root: string, config: FireclassConfig): ModelEntry[] {
  const dir = join(root, config.models.dir);
  if (!exists(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .sort()
    .map((file) => {
      const src = readFileSync(join(dir, file), "utf8");
      return {
        file,
        className: src.match(/class\s+(\w+)\s+extends\s+BaseModel/)?.[1],
        collection: src.match(/@Collection\(\s*["']([^"']+)["']\s*\)/)?.[1],
      };
    });
}

export async function runList(options: { cwd?: string } = {}): Promise<void> {
  const root = findProjectRoot(options.cwd ?? process.cwd());
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

  const models = listModels(root, config);
  p.intro("fireclass models");
  if (models.length === 0) {
    p.outro(`No models in ${config.models.dir}. Create one: fireclass model <Name>`);
    return;
  }
  p.note(
    models
      .map((m) => `${m.className ?? m.file} → "${m.collection ?? "?"}"  (${m.file})`)
      .join("\n"),
    `${models.length} model(s) in ${config.models.dir}`,
  );
  p.outro("");
}
