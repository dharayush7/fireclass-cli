import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { writeConfig, type FireclassConfig } from "../src/config";
import { doctorChecks } from "../src/commands/doctor";
import { listModels } from "../src/commands/list";
import { applyInit } from "../src/generate";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "fc-doctor-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const status = (checks: ReturnType<typeof doctorChecks>, label: string) =>
  checks.find((c) => c.label.includes(label))?.status;

describe("doctorChecks", () => {
  it("fails outright when not configured", () => {
    const checks = doctorChecks(root);
    expect(checks[0].status).toBe("fail");
  });

  it("flags missing deps and files after a bare config", () => {
    writeConfig(root, {
      version: "2.0.8",
      framework: "react",
      packageManager: "pnpm",
      package: "@dharayush7/fireclass-react",
      firebase: { path: "src/lib/firebase.ts", export: "db" },
      fireclass: { path: "src/lib/fireclass.ts" },
      models: { dir: "src/models" },
    });
    writeFileSync(join(root, "package.json"), "{}");
    const checks = doctorChecks(root);
    expect(status(checks, "@dharayush7/fireclass-react")).toBe("fail"); // not installed
    expect(status(checks, "fireclass file")).toBe("fail"); // not generated
    expect(status(checks, "tsconfig")).toBe("warn"); // no tsconfig
  });

  it("passes the essentials after init + deps present", async () => {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        dependencies: {
          "@dharayush7/fireclass-react": "^2.0.8",
          "class-validator": "^0.14.0",
          "class-transformer": "^0.5.0",
          "reflect-metadata": "^0.2.0",
          firebase: "^11.0.0",
        },
      }),
    );
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true },
      }),
    );
    const config: FireclassConfig = {
      version: "2.0.8",
      framework: "react",
      packageManager: "pnpm",
      package: "@dharayush7/fireclass-react",
      firebase: { path: "src/lib/firebase.ts", export: "db" },
      fireclass: { path: "src/lib/fireclass.ts" },
      models: { dir: "src/models" },
    };
    await applyInit(root, config, { skipInstall: true });

    const checks = doctorChecks(root);
    expect(checks.filter((c) => c.status === "fail")).toHaveLength(0);
    expect(status(checks, 'firebase export "db"')).toBe("ok");
    expect(status(checks, "tsconfig")).toBe("ok");
  });
});

describe("listModels", () => {
  it("lists generated models with class + collection", async () => {
    writeFileSync(join(root, "package.json"), "{}");
    const config: FireclassConfig = {
      version: "2.0.8",
      framework: "next",
      packageManager: "pnpm",
      package: "@dharayush7/fireclass-ssr",
      firebase: null,
      fireclass: { path: "src/lib/fireclass.ts" },
      models: { dir: "src/models" },
    };
    await applyInit(root, config, { skipInstall: true });
    const models = listModels(root, config);
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({ file: "todo.ts", className: "Todo", collection: "todos" });
  });

  it("returns [] when the models dir is absent", () => {
    const config: FireclassConfig = {
      version: "2.0.8",
      framework: "next",
      packageManager: "pnpm",
      package: "@dharayush7/fireclass-ssr",
      firebase: null,
      fireclass: { path: "src/lib/fireclass.ts" },
      models: { dir: "src/models" },
    };
    expect(listModels(root, config)).toEqual([]);
  });
});
