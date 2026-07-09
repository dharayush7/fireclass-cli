# Changelog

All notable changes to `@dharayush7/fireclass-cli`. Adheres to
[Keep a Changelog](https://keepachangelog.com) and [Semantic Versioning](https://semver.org).

## [2.0.8] - 2026-07-09

First public release of the Fireclass CLI.

### Added

- `init` — detects the framework (Next.js / React / Express) and package manager,
  then configures Fireclass: writes `fireclass.json`, installs the right package
  + validators, scaffolds a framework-specific fireclass file (and a firebase
  file if missing), adds Next.js env, creates a models directory + sample Todo,
  and patches `tsconfig` for decorators. Fully idempotent. Flags: `--yes`,
  `--framework`, `--pm`, `--skip-install`.
- `model <Name>` — generates a minimal model with the correct collection name and
  relative import. Flags: `-c/--collection`, `--dir`, `--force`.
- `doctor` — verifies config, installed dependencies, files, the firebase export,
  and tsconfig decorator flags; exits non-zero on failures.
- `list` (`ls`) — lists models (class + collection) in the models directory.
- `config` — prints the resolved `fireclass.json`.
- `--help` / `--version`, plus the `fc` bin alias.
- 45 tests covering detection, templates, generation, idempotency, and each
  command's pure logic.
