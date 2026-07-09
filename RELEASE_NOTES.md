# fireclass-cli v2.0.8

**`@dharayush7/fireclass-cli`** — the first public release of the Fireclass CLI. It configures a project to use Fireclass in one command, generates models, and health-checks the setup.

## Usage

```bash
npx fireclass init          # or: npx @dharayush7/fireclass-cli init
```

No install needed. The bin is also available as `fc`.

## Commands

- **`init`** — detects your framework (Next.js / React / Express) and package
  manager, then: writes `fireclass.json`, installs the right Fireclass package +
  `class-validator` / `class-transformer` / `reflect-metadata`, scaffolds a
  framework-wired fireclass file (and a firebase file if you don't have one),
  adds Next.js env, creates a models directory + a sample Todo, and patches
  `tsconfig` for decorators. **Idempotent** — safe to re-run.
- **`model <Name>`** — generates a minimal model (a `createdAt` field, correct
  `@Collection` and relative import). PascalCases the class, kebab-cases the file,
  pluralizes the collection. Flags: `-c/--collection`, `--dir`, `--force`.
- **`doctor`** — verifies config, installed deps, files, the firebase export, and
  the tsconfig decorator flags; exits non-zero on problems (CI-friendly).
- **`list`** (`ls`) — lists your models (class + collection).
- **`config`** — prints the resolved `fireclass.json`.

## Framework awareness

| Framework | Package installed | fireclass file |
|-----------|-------------------|----------------|
| Next.js (App Router) | `@dharayush7/fireclass-ssr` | `server-only` + `getFireclass()`; env-based creds (no firebase file) |
| React | `@dharayush7/fireclass-react` | `createFireclass(db)` + `useQuery` / `useDoc` |
| Express / Node | `@dharayush7/fireclass-js` | `createFireclass(db)` + `fireclassErrorHandler` |

## Quality

- **45 tests** covering detection, templates, idempotent generation, and each
  command's pure logic.
- Verified end-to-end: real `init` / `model` / `doctor` / `list` runs on temporary
  React and Next.js projects.
- ESM, Node ≥ 18, built with `tsup`. Uses `commander` + `@clack/prompts`.

## Docs

https://fireclass.ayushdhar.com
