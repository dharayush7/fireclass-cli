import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { readConfig } from "../config";
import { findProjectRoot, readPackageJson } from "../detect";
import { COMMON_DEPS, FRAMEWORKS } from "../frameworks";
import { exists, tsconfigDecoratorStatus } from "../util/fs";

export type CheckStatus = "ok" | "warn" | "fail";
export interface Check {
  label: string;
  status: CheckStatus;
  detail?: string;
}

/** Run all setup checks against a project. Pure and testable. */
export function doctorChecks(root: string): Check[] {
  const config = readConfig(root);
  if (!config) {
    return [
      {
        label: "fireclass.json",
        status: "fail",
        detail: "not found — run `fireclass init`",
      },
    ];
  }

  const checks: Check[] = [{ label: "fireclass.json", status: "ok" }];

  const pkg = readPackageJson(root);
  const deps = new Set([
    ...Object.keys(pkg?.dependencies ?? {}),
    ...Object.keys(pkg?.devDependencies ?? {}),
  ]);
  const depCheck = (name: string): Check =>
    deps.has(name)
      ? { label: name, status: "ok" }
      : { label: name, status: "fail", detail: "not installed" };

  checks.push(depCheck(config.package));
  for (const d of COMMON_DEPS) checks.push(depCheck(d));
  for (const d of FRAMEWORKS[config.framework].extraDeps) checks.push(depCheck(d));

  // Fireclass file.
  checks.push({
    label: `fireclass file (${config.fireclass.path})`,
    status: exists(join(root, config.fireclass.path)) ? "ok" : "fail",
    detail: exists(join(root, config.fireclass.path)) ? undefined : "missing",
  });

  // Firebase file + export (react/express).
  if (config.firebase) {
    const abs = join(root, config.firebase.path);
    if (!exists(abs)) {
      checks.push({
        label: `firebase file (${config.firebase.path})`,
        status: "fail",
        detail: "missing",
      });
    } else {
      const src = readFileSync(abs, "utf8");
      const name = config.firebase.export;
      const found = new RegExp(
        `export\\s+(const|let|var|(async\\s+)?function)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`,
      ).test(src);
      checks.push({
        label: `firebase export "${config.firebase.export}"`,
        status: found ? "ok" : "warn",
        detail: found ? undefined : "export not found in the file",
      });
    }
  }

  // Models dir.
  checks.push({
    label: `models dir (${config.models.dir})`,
    status: exists(join(root, config.models.dir)) ? "ok" : "warn",
    detail: exists(join(root, config.models.dir)) ? undefined : "missing",
  });

  // tsconfig decorator flags.
  const ts = tsconfigDecoratorStatus(root);
  checks.push({
    label: "tsconfig decorators",
    status: ts === "enabled" ? "ok" : ts === "none" ? "warn" : ts === "manual" ? "warn" : "fail",
    detail:
      ts === "enabled"
        ? undefined
        : ts === "none"
          ? "no tsconfig.json found"
          : ts === "manual"
            ? "tsconfig has comments — verify the flags by hand"
            : "add experimentalDecorators + emitDecoratorMetadata",
  });

  return checks;
}

const ICON: Record<CheckStatus, string> = { ok: "✓", warn: "△", fail: "✗" };

export async function runDoctor(options: { cwd?: string } = {}): Promise<void> {
  const root = findProjectRoot(options.cwd ?? process.cwd());
  if (!root) {
    p.cancel("No package.json found.");
    process.exitCode = 1;
    return;
  }

  p.intro("fireclass doctor");
  const checks = doctorChecks(root);
  p.note(
    checks
      .map((c) => `${ICON[c.status]} ${c.label}${c.detail ? ` — ${c.detail}` : ""}`)
      .join("\n"),
    "Checks",
  );

  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  if (fails > 0) {
    process.exitCode = 1;
    p.outro(`${fails} problem(s), ${warns} warning(s). Fix the ✗ items above.`);
  } else if (warns > 0) {
    p.outro(`All essentials pass, ${warns} warning(s).`);
  } else {
    p.outro("Everything looks good. ✓");
  }
}
