# @dharayush7/fireclass-cli

[![npm version](https://img.shields.io/npm/v/@dharayush7/fireclass-cli.svg)](https://www.npmjs.com/package/@dharayush7/fireclass-cli)
[![license](https://img.shields.io/npm/l/@dharayush7/fireclass-cli.svg)](./LICENSE)

The **Fireclass CLI** — configure a project to use [Fireclass](https://fireclass.ayushdhar.com)
in one command, then generate models and health-check your setup. Detects your
framework (Next.js / React / Express) and installs the right package.

## Usage

```bash
npx fireclass init          # or: npx @dharayush7/fireclass-cli init
```

No install needed — run it with `npx`. The bin is also available as `fc`.

## Commands

| Command | What it does |
|---------|--------------|
| `init` | Detect framework + package manager, then configure Fireclass (see below) |
| `model <Name>` | Generate a new model in the models directory |
| `doctor` | Verify the setup (config, deps, tsconfig decorator flags, files) — exits non-zero on problems |
| `list` (`ls`) | List the models found in the models directory |
| `config` | Print the resolved `fireclass.json` |
| `--help` / `-h` · `--version` / `-v` | Help and version |

### `init`

Interactively (with prefilled, detected defaults):

1. **Framework** — auto-detected: `next` / `react` / `express`.
2. **Package manager** — auto-detected from lockfile / `packageManager`.
3. **Firestore file + export name** *(react/express only)* — default `src/lib/firebase.ts`, `db`. **Skipped for Next.js**, which reads admin credentials from env.
4. **Fireclass file** — default `src/lib/fireclass.ts`.
5. **Models directory** — default `src/models`.

Then it generates:

- **`fireclass.json`** at the project root (the config the other commands read).
- Installs the framework package + `class-validator` `class-transformer` `reflect-metadata` (+ `firebase` / `firebase-admin` / `server-only`).
- A **fireclass file** wired for your framework (`createFireclass(db)` + hooks for React, `getFireclass()` `server-only` for Next.js, etc.). It exports only values bound to your app's Firestore instance.
- A starter **firebase file** — only if you don't have one.
- **Env** (`.env.local` + `.env.example`, gitignored) for Next.js.
- A **models directory** and a sample `todo.ts`.
- Patches **tsconfig** with `experimentalDecorators` + `emitDecoratorMetadata`.

Everything is **idempotent** — existing files are referenced/skipped, deps already
present are not reinstalled, and it asks before overwriting.

Flags: `--yes` (accept defaults, non-interactive), `--framework <f>`, `--pm <m>`,
`--skip-install`.

### `model <Name>`

```bash
npx fireclass model User                 # -> src/models/user.ts, collection "users"
npx fireclass model blog-post -c posts   # custom collection
npx fireclass model Order --dir src/entities --force
```

Creates a minimal model (a `createdAt` field and `@Collection`). `BaseModel` is
imported from your app's Fireclass file; `Collection` is imported directly from
the configured SDK package. PascalCases the class, kebab-cases the filename, and
pluralizes the collection.

## Import rule

Keep the generated Fireclass file for initialized, app-scoped values such as
`BaseModel`, `adapter`, `useQuery`, and `useDoc`. Import decorators and standalone
helpers directly from your SDK package: `@dharayush7/fireclass-js`,
`@dharayush7/fireclass-react`, or `@dharayush7/fireclass-ssr`.

## `fireclass.json`

```jsonc
{
  "version": "2.1.16",
  "framework": "next" | "react" | "express",
  "packageManager": "pnpm",
  "package": "@dharayush7/fireclass-ssr",
  "firebase": { "path": "src/lib/firebase.ts", "export": "db" }, // null for Next.js
  "fireclass": { "path": "src/lib/fireclass.ts" },
  "models": { "dir": "src/models" }
}
```

## The Fireclass suite

Installs one of: [`fireclass-js`](https://www.npmjs.com/package/@dharayush7/fireclass-js)
(Express), [`fireclass-ssr`](https://www.npmjs.com/package/@dharayush7/fireclass-ssr)
(Next.js), or [`fireclass-react`](https://www.npmjs.com/package/@dharayush7/fireclass-react)
(React) — all built on [`fireclass-core`](https://www.npmjs.com/package/@dharayush7/fireclass-core).

## License

MIT © Ayush Dhar
