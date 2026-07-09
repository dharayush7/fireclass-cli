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
   * Whether this framework needs a separate Firestore instance file exporting a
   * `db`. Next.js does not — `fireclass-ssr` self-initializes via `getFireclass()`.
   */
  needsFirebaseFile: boolean;
  /** Whether this framework reads admin credentials from env (Next.js). */
  usesEnv: boolean;
}

/** Dependencies every framework needs. */
export const COMMON_DEPS = [
  "class-validator",
  "class-transformer",
  "reflect-metadata",
];

export const FRAMEWORKS: Record<Framework, FrameworkInfo> = {
  next: {
    id: "next",
    label: "Next.js (App Router)",
    pkg: "@dharayush7/fireclass-ssr",
    extraDeps: ["firebase-admin", "server-only"],
    needsFirebaseFile: false,
    usesEnv: true,
  },
  react: {
    id: "react",
    label: "React",
    pkg: "@dharayush7/fireclass-react",
    extraDeps: ["firebase"],
    needsFirebaseFile: true,
    usesEnv: false,
  },
  express: {
    id: "express",
    label: "Express / Node",
    pkg: "@dharayush7/fireclass-js",
    extraDeps: ["firebase-admin"],
    needsFirebaseFile: true,
    usesEnv: false,
  },
};

/** All packages this framework needs (fireclass package + common + extra). */
export function dependenciesFor(framework: Framework): string[] {
  const info = FRAMEWORKS[framework];
  return [info.pkg, ...COMMON_DEPS, ...info.extraDeps];
}
