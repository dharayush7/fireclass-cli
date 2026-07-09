import type { Framework } from "../frameworks";
import { FRAMEWORKS } from "../frameworks";
import { toPascalCase } from "../util/paths";

/**
 * The `lib/fireclass.ts` contents — the file that binds Fireclass and is
 * imported by every model. `firebaseImport` is the relative specifier to the
 * Firestore file (react/express); it is ignored for Next.js.
 */
export function fireclassFileTemplate(
  framework: Framework,
  firebaseImport: string,
  exportName: string,
): string {
  const pkg = FRAMEWORKS[framework].pkg;

  if (framework === "next") {
    return `import "server-only";
import "reflect-metadata";
import { getFireclass } from "${pkg}";

// Memoized firebase-admin singleton (credentials from env — see .env.local).
export const { BaseModel, adapter } = getFireclass();

export { Collection, Subcollection, serialize, serializeList, runAction } from "${pkg}";
`;
  }

  if (framework === "react") {
    return `import "reflect-metadata";
import { createFireclass } from "${pkg}";
import { ${exportName} } from "${firebaseImport}";

export const { BaseModel, useQuery, useDoc, adapter } = createFireclass(${exportName});

export { Collection, Subcollection } from "${pkg}";
`;
  }

  // express
  return `import "reflect-metadata";
import { createFireclass } from "${pkg}";
import { ${exportName} } from "${firebaseImport}";

export const { BaseModel, adapter } = createFireclass(${exportName});

export { Collection, Subcollection, fireclassErrorHandler } from "${pkg}";
`;
}

/**
 * Starter `firebase.ts` — scaffolded only if the user has none. react uses the
 * client SDK (public web config from Vite env); express uses firebase-admin
 * (service-account credentials from env).
 */
export function firebaseFileTemplate(
  framework: Framework,
  exportName: string,
): string {
  if (framework === "react") {
    return `import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Public web config — safe in the browser bundle. Fill from Firebase Console ->
// Project settings -> Your apps -> Web app. Prefer Vite env vars (VITE_*).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const ${exportName} = getFirestore(app);
`;
  }

  // express
  return `import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Service-account credentials from env (see .env). PRIVATE_KEY often arrives
// with escaped newlines from a single-line env value.
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, "\\n"),
    }),
  });
}

export const ${exportName} = getFirestore();
`;
}

/** The sample `todo.ts` created by `init`. */
export function sampleTodoTemplate(fireclassImport: string): string {
  return `import { IsBoolean, IsString } from "class-validator";
import { BaseModel, Collection } from "${fireclassImport}";

@Collection("todos")
export class Todo extends BaseModel<Todo> {
  @IsString()
  title!: string;

  @IsBoolean()
  done!: boolean;

  createdAt?: Date;

  constructor(data?: Partial<Todo>) {
    super(data);
    Object.assign(this, data);
  }
}
`;
}

/** A minimal model created by `fireclass model <Name>` (only createdAt). */
export function modelTemplate(
  name: string,
  collection: string,
  fireclassImport: string,
): string {
  const cls = toPascalCase(name);
  return `import { BaseModel, Collection } from "${fireclassImport}";

@Collection("${collection}")
export class ${cls} extends BaseModel<${cls}> {
  createdAt?: Date;

  constructor(data?: Partial<${cls}>) {
    super(data);
    Object.assign(this, data);
  }
}
`;
}

/** Env keys Next.js needs for the admin singleton. */
export const NEXT_ENV_KEYS: Record<string, string> = {
  FIREBASE_PROJECT_ID: "your-project-id",
  FIREBASE_CLIENT_EMAIL:
    "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY:
    '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"',
};
