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
  });

  it("express: createFireclass(db) + error handler", () => {
    const out = fireclassFileTemplate("express", "./firebase", "db");
    expect(out).toContain('from "@dharayush7/fireclass-js"');
    expect(out).toContain("fireclassErrorHandler");
    expect(out).not.toContain("useQuery");
  });

  it("next: server-only + getFireclass(), no firebase import", () => {
    const out = fireclassFileTemplate("next", "", "");
    expect(out).toContain('import "server-only"');
    expect(out).toContain("getFireclass()");
    expect(out).toContain('from "@dharayush7/fireclass-ssr"');
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
});

describe("model templates", () => {
  it("sample Todo has fields + validators", () => {
    const out = sampleTodoTemplate("../lib/fireclass");
    expect(out).toContain("class Todo extends BaseModel<Todo>");
    expect(out).toContain('@Collection("todos")');
    expect(out).toContain("@IsString()");
    expect(out).toContain('from "../lib/fireclass"');
  });
  it("generic model has only createdAt and PascalCases the name", () => {
    const out = modelTemplate("user-profile", "user-profiles", "../lib/fireclass");
    expect(out).toContain("class UserProfile extends BaseModel<UserProfile>");
    expect(out).toContain('@Collection("user-profiles")');
    expect(out).toContain("createdAt?: Date;");
    expect(out).not.toContain("@IsString");
  });
});
