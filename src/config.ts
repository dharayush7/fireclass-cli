import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PackageManager } from "./detect";
import type { Framework } from "./frameworks";

export const CONFIG_FILENAME = "fireclass.json";

export interface FireclassConfig {
  $schema?: string;
  version: string;
  framework: Framework;
  packageManager: PackageManager;
  /** The installed Fireclass package for this framework. */
  package: string;
  /**
   * Firestore file + export. `factory` means the export is a function to call
   * (`createFireclass(getDb())`). `null` for Next.js.
   */
  firebase: { path: string; export: string; factory?: boolean } | null;
  fireclass: { path: string };
  models: { dir: string };
}

export function configPath(root: string): string {
  return join(root, CONFIG_FILENAME);
}

export function configExists(root: string): boolean {
  return existsSync(configPath(root));
}

export function readConfig(root: string): FireclassConfig | null {
  const path = configPath(root);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as FireclassConfig;
  } catch {
    return null;
  }
}

export function writeConfig(root: string, config: FireclassConfig): void {
  writeFileSync(configPath(root), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
