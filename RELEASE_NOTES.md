# fireclass-cli v2.1.17

<code>@dharayush7/fireclass-cli</code> v2.1.17 is a complete documentation and
npm discovery release. Command behavior remains compatible with v2.1.16.

## What changed

- Rebuilt the README from every CLI command and fireclass.json page on the
  Fireclass website.
- Added Firebase prerequisites, project and package-manager detection,
  interactive setup, automation options, generated artifacts, and idempotency.
- Added complete model naming rules, doctor checks and exit codes, list
  discovery limits, config behavior, and import ownership.
- Added the Fireclass logo and removed npm and license shield badges.
- Expanded npm keywords for Firestore CLI, Firebase setup, project scaffolding,
  model generation, diagnostics, Next.js, React, and Express.
- Added changelog and release notes to the published package contents.
- Synchronized the CLI-reported version and generated fireclass.json version to
  2.1.17.

## Runtime compatibility

No command semantics, flags, templates, or generated SDK ownership rules changed
in this release.

## Verify

~~~bash
npm run typecheck
npm test
npm run build
node dist/index.js --version
npm pack --dry-run
~~~

Documentation: https://fireclass.ayushdhar.com/docs/cli
