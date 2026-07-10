import { describe, expect, it } from "vitest";
import {
  fireclassFileTemplate,
  firebaseFileTemplate,
  modelTemplate,
  sampleTodoTemplate,
} from "../src/templates";

describe("fireclassFileTemplate", () => {
  it("react: createFireclass(db) + hooks, imports firebase file", () => {
    const out = fireclassFileTemplate("react", "./firebase", "db");
    expect(out).toContain('from "@dharayush7/fireclass-react"');
    expect(out).toContain("createFireclass(db)");
    expect(out).toContain("useQuery, useDoc");
    expect(out).toContain('import { db } from "./firebase"');
    expect(out).not.toContain("export {");
  });

  it("express: createFireclass(db) without SDK re-exports", () => {
    const out = fireclassFileTemplate("express", "./firebase.js", "db");
    expect(out).toContain('from "@dharayush7/fireclass-js"');
    expect(out).toContain('import { db } from "./firebase.js"');
    expect(out).not.toContain("fireclassErrorHandler");
    expect(out).not.toContain("export {");
    expect(out).not.toContain("useQuery");
  });

  it("express factory: calls the exported getDb() function", () => {
    const out = fireclassFileTemplate("express", "./firebase.js", "getDb", true);
    expect(out).toContain('import { getDb } from "./firebase.js"');
    expect(out).toContain("createFireclass(getDb())");
  });

  it("next: server-only + getFireclass(), no firebase import", () => {
    const out = fireclassFileTemplate("next", "", "");
    expect(out).toContain('import "server-only"');
    expect(out).toContain("getFireclass()");
    expect(out).toContain('from "@dharayush7/fireclass-ssr"');
    expect(out).not.toContain("serialize");
    expect(out).not.toContain("export {");
    expect(out).not.toContain("./firebase");
  });
});

describe("firebaseFileTemplate", () => {
  it("react uses the client SDK and the chosen export name", () => {
    const out = firebaseFileTemplate("react", "firestore");
    expect(out).toContain('from "firebase/firestore"');
    expect(out).toContain("export const firestore = getFirestore(app)");
  });
  it("express uses firebase-admin", () => {
    const out = firebaseFileTemplate("express", "db");
    expect(out).toContain('from "firebase-admin/firestore"');
    expect(out).toContain("export const db = getFirestore()");
  });

  it("express factory scaffolds a lazy getDb() function", () => {
    const out = firebaseFileTemplate("express", "getDb", true);
    expect(out).toContain("export function getDb(): Firestore");
    expect(out).toContain("if (getApps().length === 0)");
    expect(out).toContain("process.env.CLIENT_EMAIL");
    expect(out).toContain("return getFirestore();");
  });
});

describe("model templates", () => {
  it("sample Todo has fields + validators", () => {
    const out = sampleTodoTemplate(
      "../lib/fireclass",
      "@dharayush7/fireclass-react",
    );
    expect(out).toContain("class Todo extends BaseModel<Todo>");
    expect(out).toContain('@Collection("todos")');
    expect(out).toContain("@IsString()");
    expect(out).toContain('import { BaseModel } from "../lib/fireclass"');
    expect(out).toContain(
      'import { Collection } from "@dharayush7/fireclass-react"',
    );
  });
  it("generic model has only createdAt and PascalCases the name", () => {
    const out = modelTemplate(
      "user-profile",
      "user-profiles",
      "../lib/fireclass",
      "@dharayush7/fireclass-js",
    );
    expect(out).toContain("class UserProfile extends BaseModel<UserProfile>");
    expect(out).toContain('@Collection("user-profiles")');
    expect(out).toContain("createdAt?: Date;");
    expect(out).toContain(
      'import { Collection } from "@dharayush7/fireclass-js"',
    );
    expect(out).not.toContain("@IsString");
  });
});
