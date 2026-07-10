import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FireclassConfig } from "../src/config";
import { createModelFile, ModelExistsError } from "../src/commands/model";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "fc-model-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const config: FireclassConfig = {
  version: "2.0.8",
  framework: "react",
  packageManager: "pnpm",
  package: "@dharayush7/fireclass-react",
  firebase: { path: "src/lib/firebase.ts", export: "db" },
  fireclass: { path: "src/lib/fireclass.ts" },
  models: { dir: "src/models" },
};

const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("createModelFile", () => {
  it("creates a PascalCase model with a pluralized collection", () => {
    const res = createModelFile(root, config, "user");
    expect(res).toMatchObject({
      className: "User",
      collection: "users",
      path: join("src/models", "user.ts"),
    });
    const src = read(res.path);
    expect(src).toContain("class User extends BaseModel<User>");
    expect(src).toContain('@Collection("users")');
    expect(src).toContain("createdAt?: Date;");
    expect(src).toContain('import { BaseModel } from "../lib/fireclass"');
    expect(src).toContain(
      'import { Collection } from "@dharayush7/fireclass-react"',
    );
    expect(src).not.toContain("@IsString");
  });

  it("kebab-cases the filename and PascalCases the class", () => {
    const res = createModelFile(root, config, "user-profile");
    expect(res.path).toBe(join("src/models", "user-profile.ts"));
    expect(read(res.path)).toContain("class UserProfile");
  });

  it("honors an explicit collection and dir override", () => {
    const res = createModelFile(root, config, "Post", {
      collection: "blog_posts",
      dir: "src/entities",
    });
    expect(res.path).toBe(join("src/entities", "post.ts"));
    expect(read(res.path)).toContain('@Collection("blog_posts")');
  });

  it("uses Node ESM local imports for Express models", () => {
    const expressConfig: FireclassConfig = {
      ...config,
      framework: "express",
      package: "@dharayush7/fireclass-js",
    };
    const res = createModelFile(root, expressConfig, "invoice");
    const src = read(res.path);
    expect(src).toContain(
      'import { Collection } from "@dharayush7/fireclass-js"',
    );
    expect(src).toContain('import { BaseModel } from "../lib/fireclass.js"');
  });

  it("throws ModelExistsError when the file exists, unless force", () => {
    createModelFile(root, config, "Tag");
    expect(() => createModelFile(root, config, "Tag")).toThrow(ModelExistsError);
    // force overwrites
    const res = createModelFile(root, config, "Tag", { force: true });
    expect(existsSync(join(root, res.path))).toBe(true);
  });
});
