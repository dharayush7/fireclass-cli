import { describe, expect, it } from "vitest";
import {
  relativeImport,
  toCollectionName,
  toFileBase,
  toPascalCase,
} from "../src/util/paths";

describe("relativeImport", () => {
  it("computes a parent-relative import and drops the extension", () => {
    expect(relativeImport("src/models/todo.ts", "src/lib/fireclass.ts")).toBe(
      "../lib/fireclass",
    );
  });
  it("adds ./ for same-directory imports", () => {
    expect(relativeImport("src/lib/fireclass.ts", "src/lib/firebase.ts")).toBe(
      "./firebase",
    );
  });
  it("handles root-level layouts", () => {
    expect(relativeImport("models/todo.ts", "lib/fireclass.ts")).toBe(
      "../lib/fireclass",
    );
  });
});

describe("name helpers", () => {
  it("PascalCases", () => {
    expect(toPascalCase("user-profile")).toBe("UserProfile");
    expect(toPascalCase("todo")).toBe("Todo");
  });
  it("file base is kebab-lower", () => {
    expect(toFileBase("UserProfile")).toBe("user-profile");
    expect(toFileBase("Todo")).toBe("todo");
  });
  it("pluralizes collection names", () => {
    expect(toCollectionName("User")).toBe("users");
    expect(toCollectionName("Category")).toBe("categories");
    expect(toCollectionName("news")).toBe("news");
  });
});
