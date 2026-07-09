import { join } from "node:path";
import * as p from "@clack/prompts";
import { configExists, type FireclassConfig, readConfig } from "../config";
import {
  defaultPaths,
  detectFramework,
  detectPackageManager,
  findProjectRoot,
  type PackageManager,
  readPackageJson,
} from "../detect";
import { dependenciesFor, FRAMEWORKS, type Framework } from "../frameworks";
import { applyInit } from "../generate";
import { exists } from "../util/fs";
import { VERSION } from "../version";

export interface InitOptions {
  yes?: boolean;
  framework?: Framework;
  pm?: PackageManager;
  skipInstall?: boolean;
  cwd?: string;
}

/** Abort helper: gracefully exit when the user cancels a prompt. */
function guard<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }
  return value as T;
}

const STATUS_ICON: Record<string, string> = {
  created: "＋",
  overwritten: "↻",
  skipped: "•",
  referenced: "→",
  patched: "✎",
  manual: "!",
  installed: "⬇",
};

export async function runInit(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const root = findProjectRoot(cwd);
  if (!root) {
    p.cancel("No package.json found — run `fireclass init` inside a project.");
    process.exitCode = 1;
    return;
  }

  p.intro("fireclass init");

  // Idempotency: already configured?
  if (configExists(root)) {
    const existing = readConfig(root);
    p.note(
      existing ? JSON.stringify(existing, null, 2) : "(could not parse)",
      "Existing fireclass.json",
    );
    if (!options.yes) {
      const again = guard(
        await p.confirm({
          message: "Fireclass is already configured here. Reconfigure?",
          initialValue: false,
        }),
      );
      if (!again) {
        p.outro("Left the existing configuration untouched.");
        return;
      }
    }
  }

  const pkg = readPackageJson(root);
  if (!pkg) {
    p.cancel("Could not read package.json.");
    process.exitCode = 1;
    return;
  }

  // Framework.
  let framework = options.framework ?? detectFramework(pkg) ?? undefined;
  if (!options.yes || !framework) {
    framework = guard(
      await p.select<Framework>({
        message: "Which framework are you using?",
        initialValue: framework ?? "next",
        options: (Object.keys(FRAMEWORKS) as Framework[]).map((id) => ({
          value: id,
          label: FRAMEWORKS[id].label,
          hint: FRAMEWORKS[id].pkg,
        })),
      }),
    );
  }

  // Package manager.
  let pm = options.pm ?? detectPackageManager(root) ?? undefined;
  if (!options.yes || !pm) {
    pm = guard(
      await p.select<PackageManager>({
        message: "Package manager",
        initialValue: pm ?? "npm",
        options: (["pnpm", "yarn", "bun", "npm"] as PackageManager[]).map((v) => ({
          value: v,
          label: v,
        })),
      }),
    );
  }

  const defaults = defaultPaths(root);
  const info = FRAMEWORKS[framework];

  // Firebase file + export (react/express only; Next self-initializes).
  let firebase: FireclassConfig["firebase"] = null;
  if (info.needsFirebaseFile) {
    const path = options.yes
      ? defaults.firebase
      : guard(
          await p.text({
            message: "Firestore instance file (exports your db)",
            initialValue: defaults.firebase,
          }),
        );
    const exportName = options.yes
      ? "db"
      : guard(
          await p.text({
            message: "Firestore export name",
            initialValue: "db",
          }),
        );
    firebase = { path: String(path), export: String(exportName) };
  } else {
    p.log.info("Next.js uses env-based credentials — no separate Firestore file needed.");
  }

  const fireclassPath = options.yes
    ? defaults.fireclass
    : guard(
        await p.text({
          message: "Fireclass file (BaseModel + hooks)",
          initialValue: defaults.fireclass,
        }),
      );

  const modelsDir = options.yes
    ? defaults.models
    : guard(
        await p.text({
          message: "Models directory",
          initialValue: defaults.models,
        }),
      );

  const config: FireclassConfig = {
    $schema: "https://fireclass.ayushdhar.com/schema.json",
    version: VERSION,
    framework,
    packageManager: pm,
    package: info.pkg,
    firebase,
    fireclass: { path: String(fireclassPath) },
    models: { dir: String(modelsDir) },
  };

  // Overwrite an existing fireclass file?
  let overwriteFireclass = false;
  if (exists(join(root, config.fireclass.path)) && !options.yes) {
    overwriteFireclass = guard(
      await p.confirm({
        message: `${config.fireclass.path} exists. Overwrite it?`,
        initialValue: false,
      }),
    );
  }

  // Install now?
  let skipInstall = options.skipInstall ?? false;
  const deps = dependenciesFor(framework);
  if (!options.yes && !skipInstall) {
    const install = guard(
      await p.confirm({
        message: `Install ${deps.length} dependencies with ${pm}?`,
        initialValue: true,
      }),
    );
    skipInstall = !install;
  }

  try {
    if (!skipInstall) p.log.info(`Installing with ${pm}: ${deps.join(", ")}`);
    const actions = await applyInit(root, config, { overwriteFireclass, skipInstall });

    p.note(
      actions
        .map((a) => `${STATUS_ICON[a.status] ?? "•"} ${a.label} — ${a.status}`)
        .join("\n"),
      "Summary",
    );

    if (actions.some((a) => a.status === "manual")) {
      p.log.warn(
        "Add \"experimentalDecorators\" and \"emitDecoratorMetadata\" to your tsconfig.json manually (it has comments, so it wasn't auto-edited).",
      );
    }

    p.outro(
      skipInstall
        ? `Configured. Install deps, then: fireclass model <Name>`
        : `Ready! Create a model: fireclass model <Name>`,
    );
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
