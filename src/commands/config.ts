import * as p from "@clack/prompts";
import { CONFIG_FILENAME, readConfig } from "../config";
import { findProjectRoot } from "../detect";

/** Print the resolved fireclass.json. */
export async function runConfig(options: { cwd?: string } = {}): Promise<void> {
  const root = findProjectRoot(options.cwd ?? process.cwd());
  if (!root) {
    p.cancel("No package.json found.");
    process.exitCode = 1;
    return;
  }
  const config = readConfig(root);
  if (!config) {
    p.cancel(`No ${CONFIG_FILENAME}. Run \`fireclass init\` first.`);
    process.exitCode = 1;
    return;
  }
  p.intro(CONFIG_FILENAME);
  p.note(JSON.stringify(config, null, 2), "Configuration");
  p.outro("");
}
