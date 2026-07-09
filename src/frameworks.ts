/** The frameworks Fireclass can configure, and how each maps to a package. */
export type Framework = "next" | "react" | "express";

export interface FrameworkInfo {
  id: Framework;
  label: string;
  /** The Fireclass package to install for this framework. */
  pkg: string;
  /** Extra runtime dependencies to install alongside the common ones. */
  extraDeps: string[];
  /**
   * Whether this framework needs a separate Firestore file. Next.js does not —
   * `fireclass-ssr` self-initializes via `getFireclass()`.
   */
  needsFirebaseFile: boolean;
  /** Default export from the firebase file (react/express). */
  defaultExport: string;
  /** Whether the default export is a factory to call — `createFireclass(getDb())`. */
  defaultFactory: boolean;
  /** Env keys to scaffold into .env.example (and .env.local when `envLocal`). */
  envKeys?: Record<string, string>;
  /** Write a gitignored `.env.local` (Next.js) vs only `.env.example`. */
  envLocal: boolean;
}

/** Dependencies every framework needs. */
export const COMMON_DEPS = [
  "class-validator",
  "class-transformer",
  "reflect-metadata",
];

const FIREBASE_ENV: Record<string, string> = {
  FIREBASE_PROJECT_ID: "your-project-id",
  FIREBASE_CLIENT_EMAIL:
    "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY:
    '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"',
};

// Express uses the unprefixed names read by the generated getDb() factory.
const ADMIN_ENV: Record<string, string> = {
  PROJECT_ID: "your-project-id",
  CLIENT_EMAIL:
    "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  PRIVATE_KEY:
    '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"',
};

export const FRAMEWORKS: Record<Framework, FrameworkInfo> = {
  next: {
    id: "next",
    label: "Next.js (App Router)",
    pkg: "@dharayush7/fireclass-ssr",
    extraDeps: ["firebase-admin", "server-only"],
    needsFirebaseFile: false,
    defaultExport: "",
    defaultFactory: false,
    envKeys: FIREBASE_ENV,
    envLocal: true,
  },
  react: {
    id: "react",
    label: "React",
    pkg: "@dharayush7/fireclass-react",
    extraDeps: ["firebase"],
    needsFirebaseFile: true,
    defaultExport: "db",
    defaultFactory: false,
    envLocal: false,
  },
  express: {
    id: "express",
    label: "Express / Node",
    pkg: "@dharayush7/fireclass-js",
    extraDeps: ["firebase-admin"],
    needsFirebaseFile: true,
    defaultExport: "getDb",
    defaultFactory: true,
    envKeys: ADMIN_ENV,
    envLocal: false,
  },
};

/** All packages this framework needs (fireclass package + common + extra). */
export function dependenciesFor(framework: Framework): string[] {
  const info = FRAMEWORKS[framework];
  return [info.pkg, ...COMMON_DEPS, ...info.extraDeps];
}
