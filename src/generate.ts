import { join } from "node:path";
import type { FireclassConfig } from "./config";
import { writeConfig } from "./config";
import { dependenciesFor, FRAMEWORKS } from "./frameworks";
import {
  fireclassFileTemplate,
  firebaseFileTemplate,
  NEXT_ENV_KEYS,
  sampleTodoTemplate,
} from "./templates";
import {
  ensureDir,
  ensureEnvKeys,
  ensureGitignore,
  exists,
  patchTsconfigDecorators,
  writeFile,
  writeIfAbsent,
} from "./util/fs";
import { relativeImport } from "./util/paths";
import { type CommandRunner, installDeps } from "./util/pm";

export type ActionStatus =
  | "created"
  | "overwritten"
  | "skipped"
  | "referenced"
  | "patched"
  | "manual"
  | "installed";

export interface Action {
  label: string;
  status: ActionStatus;
}

export interface GenerateOptions {
  /** Overwrite the fireclass file if it already exists. */
  overwriteFireclass?: boolean;
  /** Skip dependency installation. */
  skipInstall?: boolean;
  /** Injected command runner (tests pass a fake). */
  runner?: CommandRunner;
}

/**
 * Apply an init configuration to a project: write config, scaffold files,
 * (optionally) install deps, and patch tsconfig. Idempotent — existing files are
 * referenced/skipped rather than clobbered (except the fireclass file when
 * `overwriteFireclass` is set). Returns a report of what happened.
 */
export async function applyInit(
  root: string,
  config: FireclassConfig,
  options: GenerateOptions = {},
): Promise<Action[]> {
  const actions: Action[] = [];
  const info = FRAMEWORKS[config.framework];

  // 1. Config file.
  writeConfig(root, config);
  actions.push({ label: "fireclass.json", status: "created" });

  // 2. Firebase Firestore file (react/express only).
  if (info.needsFirebaseFile && config.firebase) {
    const abs = join(root, config.firebase.path);
    if (exists(abs)) {
      actions.push({ label: config.firebase.path, status: "referenced" });
    } else {
      writeFile(abs, firebaseFileTemplate(config.framework, config.firebase.export));
      actions.push({ label: config.firebase.path, status: "created" });
    }
  }

  // 3. Fireclass file.
  const fcAbs = join(root, config.fireclass.path);
  const firebaseImport = config.firebase
    ? relativeImport(config.fireclass.path, config.firebase.path)
    : "";
  const fcContent = fireclassFileTemplate(
    config.framework,
    firebaseImport,
    config.firebase?.export ?? "db",
  );
  if (exists(fcAbs) && !options.overwriteFireclass) {
    actions.push({ label: config.fireclass.path, status: "skipped" });
  } else {
    const existed = exists(fcAbs);
    writeFile(fcAbs, fcContent);
    actions.push({
      label: config.fireclass.path,
      status: existed ? "overwritten" : "created",
    });
  }

  // 4. Models directory + sample Todo.
  ensureDir(join(root, config.models.dir));
  const todoRel = join(config.models.dir, "todo.ts");
  const todoImport = relativeImport(todoRel, config.fireclass.path);
  const wroteTodo = writeIfAbsent(
    join(root, todoRel),
    sampleTodoTemplate(todoImport),
  );
  actions.push({ label: todoRel, status: wroteTodo ? "created" : "skipped" });

  // 5. Env (Next.js).
  if (info.usesEnv) {
    const addedLocal = ensureEnvKeys(join(root, ".env.local"), NEXT_ENV_KEYS);
    ensureEnvKeys(join(root, ".env.example"), NEXT_ENV_KEYS);
    ensureGitignore(root, ".env.local");
    actions.push({
      label: ".env.local",
      status: addedLocal.length > 0 ? "created" : "skipped",
    });
  }

  // 6. tsconfig decorator flags.
  const ts = patchTsconfigDecorators(root);
  if (ts === "patched") actions.push({ label: "tsconfig.json (decorators)", status: "patched" });
  else if (ts === "manual") actions.push({ label: "tsconfig.json (decorators)", status: "manual" });

  // 7. Install dependencies.
  if (!options.skipInstall) {
    await installDeps(
      config.packageManager,
      dependenciesFor(config.framework),
      root,
      options.runner,
    );
    actions.push({ label: "dependencies", status: "installed" });
  }

  return actions;
}
