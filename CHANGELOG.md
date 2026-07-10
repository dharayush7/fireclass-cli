# Changelog

All notable changes to `@dharayush7/fireclass-cli`. Adheres to
[Keep a Changelog](https://keepachangelog.com) and [Semantic Versioning](https://semver.org).

## [2.1.16] - 2026-07-10

### Changed

- Generated Fireclass files now export only values initialized against the
  application's Firestore instance: `BaseModel`, `adapter`, and React hooks.
- Removed generated re-exports of `Collection`, `Subcollection`, `serialize`,
  `serializeList`, `runAction`, and `fireclassErrorHandler` from app-level
  Fireclass files.
- `init` and `model` now generate direct `Collection` imports from the selected
  SDK package while keeping `BaseModel` imports pointed at the app binding.
- Express local imports now use `.js` specifiers so generated TypeScript compiles
  under Node's `NodeNext` ESM resolution.
- Updated all CLI framework examples, planning docs, and website snippets to use
  the same direct-import convention.

### Migration

- Existing apps can delete SDK re-export lines from their `lib/fireclass` file
  and import decorators or standalone helpers directly from their runtime SDK.

## [2.1.15] - 2026-07-09

First public release of the Fireclass CLI.

### Added

- `init` — detects the framework (Next.js / React / Express) and package manager,
  then configures Fireclass: writes `fireclass.json`, installs the right package
  + validators, scaffolds a framework-specific fireclass file (and a firebase
  file if missing), adds env, creates a models directory + sample Todo, and
  patches `tsconfig` for decorators. Fully idempotent. Flags: `--yes`,
  `--framework`, `--pm`, `--skip-install`.
- Express uses a lazy **`getDb()` factory** (the common firebase-admin idiom) and
  generates `createFireclass(getDb())`. The firebase export may be a value (`db`)
  or a factory (`getDb()`), recorded as `firebase.factory` in `fireclass.json`;
  Express also scaffolds `.env.example` (`PROJECT_ID` / `CLIENT_EMAIL` /
  `PRIVATE_KEY`).
- `model <Name>` — generates a minimal model with the correct collection name and
  relative import. Flags: `-c/--collection`, `--dir`, `--force`.
- `doctor` — verifies config, installed dependencies, files, the firebase export,
  and tsconfig decorator flags; exits non-zero on failures.
- `list` (`ls`) — lists models (class + collection) in the models directory.
- `config` — prints the resolved `fireclass.json`.
- `--help` / `--version`, plus the `fc` bin alias.
- `--yes` is fully non-interactive: it falls back to `npm` when the package
  manager can't be detected instead of prompting (which crashed in non-TTY
  environments).
- 50 tests covering detection, templates, generation, idempotency, and each
  command's pure logic.

### tsconfig handling

- The decorator patch follows tsconfig `references` and targets the config that
  actually compiles `src` (e.g. `tsconfig.app.json` in a Vite split layout),
  rather than only the root `tsconfig.json` — fixing the `ts(1240)` "unable to
  resolve signature of property decorator" error. Comment-containing (jsonc)
  configs are edited in place without losing comments. `doctor` checks the same
  effective config(s).
