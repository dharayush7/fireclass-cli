import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  defaultPaths,
  detectFramework,
  detectPackageManager,
  hasSrcLayout,
} from "../src/detect";

describe("detectFramework", () => {
  it("prefers next over react", () => {
    expect(
      detectFramework({ dependencies: { next: "15", react: "18", "react-dom": "18" } }),
    ).toBe("next");
  });
  it("detects express", () => {
    expect(detectFramework({ dependencies: { express: "4" } })).toBe("express");
  });
  it("detects react (needs react-dom)", () => {
    expect(detectFramework({ dependencies: { react: "18", "react-dom": "18" } })).toBe("react");
    expect(detectFramework({ dependencies: { react: "18" } })).toBeNull();
  });
  it("reads devDependencies too", () => {
    expect(detectFramework({ devDependencies: { next: "15" } })).toBe("next");
  });
  it("returns null when nothing matches", () => {
    expect(detectFramework({ dependencies: { lodash: "4" } })).toBeNull();
  });
});

describe("filesystem-based detection", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "fc-detect-"));
    writeFileSync(join(dir, "package.json"), "{}");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("detects pnpm from the packageManager field", () => {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ packageManager: "pnpm@10" }));
    expect(detectPackageManager(dir)).toBe("pnpm");
  });
  it("detects yarn from a lockfile", () => {
    writeFileSync(join(dir, "yarn.lock"), "");
    expect(detectPackageManager(dir)).toBe("yarn");
  });
  it("detects npm from package-lock.json", () => {
    writeFileSync(join(dir, "package-lock.json"), "{}");
    expect(detectPackageManager(dir)).toBe("npm");
  });

  it("defaults paths to src/ when present, root otherwise", () => {
    expect(hasSrcLayout(dir)).toBe(false);
    expect(defaultPaths(dir).fireclass).toBe("lib/fireclass.ts");
    require("node:fs").mkdirSync(join(dir, "src"));
    expect(hasSrcLayout(dir)).toBe(true);
    expect(defaultPaths(dir).fireclass).toBe("src/lib/fireclass.ts");
    expect(defaultPaths(dir).models).toBe("src/models");
  });
});
