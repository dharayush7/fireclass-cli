import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureEnvKeys,
  ensureGitignore,
  patchTsconfigDecorators,
  writeIfAbsent,
} from "../src/util/fs";
import { installCommand } from "../src/util/pm";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "fc-fs-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("writeIfAbsent", () => {
  it("writes when absent, skips when present", () => {
    const p = join(dir, "a/b.ts");
    expect(writeIfAbsent(p, "one")).toBe(true);
    expect(writeIfAbsent(p, "two")).toBe(false);
    expect(readFileSync(p, "utf8")).toBe("one");
  });
});

describe("ensureEnvKeys", () => {
  it("appends only missing keys", () => {
    const p = join(dir, ".env.local");
    writeFileSync(p, "FIREBASE_PROJECT_ID=already\n");
    const added = ensureEnvKeys(p, {
      FIREBASE_PROJECT_ID: "x",
      FIREBASE_CLIENT_EMAIL: "y",
    });
    expect(added).toEqual(["FIREBASE_CLIENT_EMAIL"]);
    const out = readFileSync(p, "utf8");
    expect(out).toContain("FIREBASE_PROJECT_ID=already");
    expect(out).toContain("FIREBASE_CLIENT_EMAIL=y");
  });
});

describe("ensureGitignore", () => {
  it("adds an entry once", () => {
    expect(ensureGitignore(dir, ".env.local")).toBe(true);
    expect(ensureGitignore(dir, ".env.local")).toBe(false);
  });
});

describe("patchTsconfigDecorators", () => {
  it("returns none without a tsconfig", () => {
    expect(patchTsconfigDecorators(dir)).toBe("none");
  });
  it("patches missing flags", () => {
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: {} }));
    expect(patchTsconfigDecorators(dir)).toBe("patched");
    const cfg = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
    expect(cfg.compilerOptions.experimentalDecorators).toBe(true);
    expect(cfg.compilerOptions.emitDecoratorMetadata).toBe(true);
  });
  it("reports already when set", () => {
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true },
      }),
    );
    expect(patchTsconfigDecorators(dir)).toBe("already");
  });
  it("reports manual for jsonc with comments", () => {
    writeFileSync(join(dir, "tsconfig.json"), '{\n  // a comment\n  "compilerOptions": {}\n}');
    expect(patchTsconfigDecorators(dir)).toBe("manual");
  });
});

describe("installCommand", () => {
  it("builds per package manager", () => {
    expect(installCommand("pnpm", ["a", "b"])).toEqual({ cmd: "pnpm", args: ["add", "a", "b"] });
    expect(installCommand("npm", ["a"])).toEqual({ cmd: "npm", args: ["install", "a"] });
    expect(installCommand("yarn", ["a"])).toEqual({ cmd: "yarn", args: ["add", "a"] });
    expect(installCommand("bun", ["a"])).toEqual({ cmd: "bun", args: ["add", "a"] });
  });
});
