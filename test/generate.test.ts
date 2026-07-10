import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FireclassConfig } from "../src/config";
import { applyInit } from "../src/generate";
import type { CommandRunner } from "../src/util/pm";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "fc-gen-"));
  writeFileSync(join(root, "package.json"), "{}");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const has = (rel: string) => existsSync(join(root, rel));

const reactConfig: FireclassConfig = {
  version: "2.0.8",
  framework: "react",
  packageManager: "pnpm",
  package: "@dharayush7/fireclass-react",
  firebase: { path: "src/lib/firebase.ts", export: "db" },
  fireclass: { path: "src/lib/fireclass.ts" },
  models: { dir: "src/models" },
};

const nextConfig: FireclassConfig = {
  version: "2.0.8",
  framework: "next",
  packageManager: "pnpm",
  package: "@dharayush7/fireclass-ssr",
  firebase: null,
  fireclass: { path: "src/lib/fireclass.ts" },
  models: { dir: "src/models" },
};

describe("applyInit — react", () => {
  it("writes config, firebase, fireclass, models + installs the right deps", async () => {
    const runner = vi.fn<CommandRunner>().mockResolvedValue(0);
    await applyInit(root, reactConfig, { runner });

    expect(JSON.parse(read("fireclass.json")).framework).toBe("react");
    expect(read("src/lib/firebase.ts")).toContain("getFirestore(app)");
    expect(read("src/lib/fireclass.ts")).toContain("createFireclass(db)");
    expect(read("src/lib/fireclass.ts")).not.toContain("export {");
    // Bound values stay local; decorators come directly from the SDK.
    expect(read("src/models/todo.ts")).toContain(
      'import { BaseModel } from "../lib/fireclass"',
    );
    expect(read("src/models/todo.ts")).toContain(
      'import { Collection } from "@dharayush7/fireclass-react"',
    );

    // install called with the react package + validators + firebase
    const [cmd, args] = runner.mock.calls[0];
    expect(cmd).toBe("pnpm");
    expect(args).toContain("@dharayush7/fireclass-react");
    expect(args).toContain("class-validator");
    expect(args).toContain("firebase");
  });

  it("references an existing firebase file instead of overwriting it", async () => {
    writeFileSync(join(root, "package.json"), "{}");
    const fbDir = join(root, "src/lib");
    require("node:fs").mkdirSync(fbDir, { recursive: true });
    writeFileSync(join(fbDir, "firebase.ts"), "// user's own\n");
    const actions = await applyInit(root, reactConfig, { skipInstall: true });
    expect(read("src/lib/firebase.ts")).toBe("// user's own\n");
    expect(actions.find((a) => a.label === "src/lib/firebase.ts")?.status).toBe("referenced");
  });
});

const expressConfig: FireclassConfig = {
  version: "2.0.8",
  framework: "express",
  packageManager: "npm",
  package: "@dharayush7/fireclass-js",
  firebase: { path: "src/lib/firebase.ts", export: "getDb", factory: true },
  fireclass: { path: "src/lib/fireclass.ts" },
  models: { dir: "src/models" },
};

describe("applyInit — express (getDb factory)", () => {
  it("scaffolds a getDb() firebase file and calls it in fireclass", async () => {
    await applyInit(root, expressConfig, { skipInstall: true });
    expect(read("src/lib/firebase.ts")).toContain("export function getDb(): Firestore");
    expect(read("src/lib/fireclass.ts")).toContain("createFireclass(getDb())");
    expect(read("src/lib/fireclass.ts")).toContain('from "./firebase.js"');
    expect(read("src/models/todo.ts")).toContain(
      'import { BaseModel } from "../lib/fireclass.js"',
    );
    // env.example (unprefixed admin keys) + gitignore .env, no .env.local
    expect(read(".env.example")).toContain("PROJECT_ID=");
    expect(read(".env.example")).toContain("CLIENT_EMAIL=");
    expect(has(".env.local")).toBe(false);
    expect(read(".gitignore")).toContain(".env");
  });

  it("references an existing getDb() file (no overwrite)", async () => {
    require("node:fs").mkdirSync(join(root, "src/lib"), { recursive: true });
    require("node:fs").writeFileSync(
      join(root, "src/lib/firebase.ts"),
      "export function getDb() { return {} as any; }\n",
    );
    const actions = await applyInit(root, expressConfig, { skipInstall: true });
    expect(actions.find((a) => a.label === "src/lib/firebase.ts")?.status).toBe("referenced");
    expect(read("src/lib/fireclass.ts")).toContain("createFireclass(getDb())");
    expect(read("src/lib/fireclass.ts")).toContain('from "./firebase.js"');
  });
});

describe("applyInit — next", () => {
  it("skips firebase file, writes server-only fireclass, adds env + gitignore", async () => {
    await applyInit(root, nextConfig, { skipInstall: true });
    expect(has("src/lib/firebase.ts")).toBe(false);
    expect(read("src/lib/fireclass.ts")).toContain('import "server-only"');
    expect(read(".env.local")).toContain("FIREBASE_PROJECT_ID=");
    expect(read(".env.example")).toContain("FIREBASE_CLIENT_EMAIL=");
    expect(read(".gitignore")).toContain(".env.local");
  });
});

describe("applyInit — idempotency", () => {
  it("skips the fireclass file when present, unless overwrite is set", async () => {
    let actions = await applyInit(root, reactConfig, { skipInstall: true });
    expect(actions.find((a) => a.label === reactConfig.fireclass.path)?.status).toBe("created");

    // second run: skipped
    actions = await applyInit(root, reactConfig, { skipInstall: true });
    expect(actions.find((a) => a.label === reactConfig.fireclass.path)?.status).toBe("skipped");

    // with overwrite: overwritten
    actions = await applyInit(root, reactConfig, { skipInstall: true, overwriteFireclass: true });
    expect(actions.find((a) => a.label === reactConfig.fireclass.path)?.status).toBe("overwritten");
  });

  it("does not reinstall or duplicate the sample todo on re-run", async () => {
    await applyInit(root, reactConfig, { skipInstall: true });
    writeFileSync(join(root, "src/models/todo.ts"), "// edited\n");
    const actions = await applyInit(root, reactConfig, { skipInstall: true });
    expect(read("src/models/todo.ts")).toBe("// edited\n");
    expect(actions.find((a) => a.label === "src/models/todo.ts")?.status).toBe("skipped");
  });

  it("patches tsconfig decorator flags when a plain tsconfig exists", async () => {
    writeFileSync(join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: {} }));
    const actions = await applyInit(root, reactConfig, { skipInstall: true });
    expect(actions.find((a) => a.label.startsWith("tsconfig"))?.status).toBe("patched");
    expect(JSON.parse(read("tsconfig.json")).compilerOptions.experimentalDecorators).toBe(true);
  });
});
