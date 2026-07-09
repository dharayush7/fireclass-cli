import { Command } from "commander";
import { runConfig } from "./commands/config";
import { runDoctor } from "./commands/doctor";
import { runInit } from "./commands/init";
import { runList } from "./commands/list";
import { runModel } from "./commands/model";
import type { PackageManager } from "./detect";
import type { Framework } from "./frameworks";
import { VERSION } from "./version";

const program = new Command();

program
  .name("fireclass")
  .description("Configure and scaffold Fireclass in a Next.js, React, or Express project.")
  .version(VERSION, "-v, --version", "print the CLI version");

program
  .command("init")
  .description("Configure Fireclass in the current project")
  .option("-y, --yes", "accept all detected defaults (non-interactive)")
  .option("--framework <framework>", "next | react | express")
  .option("--pm <manager>", "pnpm | yarn | bun | npm")
  .option("--skip-install", "do not install dependencies")
  .action((opts) =>
    runInit({
      yes: opts.yes,
      framework: opts.framework as Framework | undefined,
      pm: opts.pm as PackageManager | undefined,
      skipInstall: opts.skipInstall,
    }),
  );

program
  .command("model")
  .argument("<name>", "model name, e.g. User or blog-post")
  .description("Generate a new model in the models directory")
  .option("-c, --collection <name>", "Firestore collection name")
  .option("--dir <path>", "override the models directory")
  .option("--force", "overwrite an existing model file")
  .action((name, opts) =>
    runModel(name, { collection: opts.collection, dir: opts.dir, force: opts.force }),
  );

program
  .command("doctor")
  .description("Verify the Fireclass setup (config, deps, tsconfig, files)")
  .action(() => runDoctor());

program
  .command("list")
  .alias("ls")
  .description("List the models in the models directory")
  .action(() => runList());

program
  .command("config")
  .description("Print the resolved fireclass.json")
  .action(() => runConfig());

program.parseAsync().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
