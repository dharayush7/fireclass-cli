<p align="center">
  <a href="https://fireclass.ayushdhar.com">
    <img src="https://fireclass.ayushdhar.com/logo.png" alt="Fireclass logo" width="120" height="120" />
  </a>
</p>

<h1 align="center">@dharayush7/fireclass-cli</h1>

<p align="center">
  Framework-aware Fireclass setup, typed model generation, configuration inspection, and project diagnostics.
</p>

<p align="center">
  <a href="https://fireclass.ayushdhar.com/docs/cli">CLI documentation</a> |
  <a href="https://fireclass.ayushdhar.com/docs/configuration/fireclass-json">Configuration</a> |
  <a href="https://fireclass.ayushdhar.com/docs/packages">Packages</a> |
  <a href="https://github.com/dharayush7/fireclass-cli">GitHub</a> |
  <a href="https://www.npmjs.com/package/@dharayush7/fireclass-cli">npm</a>
</p>

The Fireclass CLI detects Next.js, React, and Express projects, installs the
correct SDK, records project structure in <code>fireclass.json</code>, generates
models, and verifies local setup.

The same CLI is available through the unscoped <code>fireclass</code> launcher.

## Requirements

- Node.js 18 or newer.
- A project containing <code>package.json</code>.
- TypeScript for generated models.
- Firebase project and framework-specific Firebase initialization completed
  before <code>fireclass init</code>.

Prepare the runtime first:

- [Next.js prerequisites and setup](https://fireclass.ayushdhar.com/docs/installation/nextjs)
- [React prerequisites and setup](https://fireclass.ayushdhar.com/docs/installation/react)
- [Express prerequisites and setup](https://fireclass.ayushdhar.com/docs/installation/express)

The CLI references existing Firebase files and never overwrites them.

## Run the CLI

~~~bash
npx fireclass --help
npx fireclass init
~~~

Equivalent commands:

~~~bash
npx @dharayush7/fireclass-cli init
npx fireclass init
~~~

When installed locally, both binary names are available:

~~~bash
fireclass doctor
fc doctor
~~~

## Command overview

| Command | Purpose |
| --- | --- |
| <code>fireclass init</code> | Detect the framework and configure Fireclass |
| <code>fireclass model &lt;Name&gt;</code> | Generate a typed model |
| <code>fireclass doctor</code> | Check dependencies, paths, exports, and TypeScript decorators |
| <code>fireclass list</code> | List discoverable models and collections |
| <code>fireclass ls</code> | Alias for <code>list</code> |
| <code>fireclass config</code> | Print the resolved <code>fireclass.json</code> |

Global options:

| Option | Purpose |
| --- | --- |
| <code>-h, --help</code> | Print global or command help |
| <code>-v, --version</code> | Print the CLI version |

Unknown commands, missing required arguments, and command failures exit
non-zero.

## Project resolution and detection

Every command walks upward from the current directory to the nearest folder
containing <code>package.json</code>. In a workspace, the nearest package
controls the configuration.

Framework detection reads dependencies and dev dependencies:

1. <code>next</code> selects Next.js.
2. <code>express</code> selects Express or Node.js.
3. <code>react</code> plus <code>react-dom</code> selects React.

Next.js wins over React because Next projects also declare React.

Package-manager detection checks:

1. The <code>packageManager</code> field.
2. <code>pnpm-lock.yaml</code>, <code>yarn.lock</code>,
   <code>bun.lockb</code>, <code>bun.lock</code>, then
   <code>package-lock.json</code>.
3. The package-manager user-agent value.

Interactive mode lets you change detected values. Non-interactive mode falls
back to npm when no package manager is detected.

## fireclass init

~~~bash
fireclass init [options]
~~~

| Option | Purpose |
| --- | --- |
| <code>-y, --yes</code> | Accept detected defaults without prompts |
| <code>--framework &lt;next\|react\|express&gt;</code> | Override framework detection |
| <code>--pm &lt;pnpm\|yarn\|bun\|npm&gt;</code> | Override package-manager detection |
| <code>--skip-install</code> | Generate configuration without installing dependencies |
| <code>-h, --help</code> | Print command help |

Interactive setup asks for:

1. Framework and package manager.
2. Firebase file and named export for React or Express.
3. Fireclass entry file.
4. Models directory.
5. Permission before replacing an existing Fireclass entry.
6. Permission before dependency installation.

Projects with a <code>src</code> directory default to:

~~~text
src/lib/firebase.ts
src/lib/fireclass.ts
src/models
~~~

Projects without <code>src</code> default to:

~~~text
lib/firebase.ts
lib/fireclass.ts
models
~~~

For Firebase exports, enter a value such as <code>db</code> or a factory such
as <code>getDb()</code>. Parentheses record <code>factory: true</code>, causing
the generated binding to call the function.

### Framework behavior

| Framework | SDK | Firebase behavior |
| --- | --- | --- |
| Next.js | <code>@dharayush7/fireclass-ssr</code> | No Firebase file; credentials come from environment variables or ADC |
| React | <code>@dharayush7/fireclass-react</code> | Firebase client SDK with a default <code>db</code> export |
| Express | <code>@dharayush7/fireclass-js</code> | Firebase Admin with a default <code>getDb()</code> factory |

All frameworks install <code>class-validator</code>,
<code>class-transformer</code>, and <code>reflect-metadata</code>. React adds
<code>firebase</code>; Express adds <code>firebase-admin</code>; Next.js adds
<code>firebase-admin</code> and <code>server-only</code>.

### Generated artifacts

<code>init</code> writes or manages:

- <code>fireclass.json</code> with the public schema URL, CLI version,
  framework, package manager, SDK, paths, and Firebase export.
- A framework-specific Fireclass entry exporting initialized
  <code>BaseModel</code>, adapter, and React hooks where applicable.
- A Firebase entry for React or Express only when the configured file is
  missing.
- A starter Todo model when it is missing.
- Decorator flags in the effective TypeScript configuration.
- Next.js <code>.env.local</code> and <code>.env.example</code>, or Express
  <code>.env.example</code>.
- Gitignore entries for private environment files.

Generated Fireclass entries do not re-export SDK decorators or helpers.

### Idempotency

- Existing Firebase files are referenced and never overwritten.
- Existing starter models are skipped.
- Missing environment keys and gitignore entries are appended.
- Existing Fireclass entries require interactive overwrite approval.
- Existing configuration is displayed before interactive reconfiguration.
- <code>--yes</code> rewrites configuration with detected or supplied values
  while still skipping an existing Fireclass entry.

Use explicit framework and package-manager options when automating configured
projects:

~~~bash
npx fireclass init --yes --framework react --pm pnpm
npx fireclass init --yes --framework express --pm npm --skip-install
~~~

## fireclass model

~~~bash
fireclass model [options] <name>
~~~

| Option | Purpose |
| --- | --- |
| <code>-c, --collection &lt;name&gt;</code> | Override the Firestore collection |
| <code>--dir &lt;path&gt;</code> | Override the configured models directory for this command |
| <code>--force</code> | Replace an existing model file |
| <code>-h, --help</code> | Print command help |

Naming examples:

| Input | Class | File | Default collection |
| --- | --- | --- | --- |
| <code>User</code> | <code>User</code> | <code>user.ts</code> | <code>users</code> |
| <code>user-profile</code> | <code>UserProfile</code> | <code>user-profile.ts</code> | <code>userprofiles</code> |
| <code>Category</code> | <code>Category</code> | <code>category.ts</code> | <code>categories</code> |
| <code>Status</code> | <code>Status</code> | <code>status.ts</code> | <code>status</code> |

Pluralization is intentionally simple. Use <code>--collection</code> when the
desired Firestore name differs.

~~~bash
npx fireclass model User
npx fireclass model user-profile --collection user_profiles
npx fireclass model Order --dir src/entities
~~~

The generated model imports <code>Collection</code> directly from the configured
SDK and <code>BaseModel</code> from the local Fireclass entry. Express relative
imports use a Node ESM-compatible <code>.js</code> suffix.

<code>--force</code> replaces the entire target file; it does not merge fields.

## fireclass doctor

~~~bash
fireclass doctor
~~~

Doctor performs local, read-only checks:

| Check | Result |
| --- | --- |
| <code>fireclass.json</code> | Must exist and parse |
| Runtime SDK | Must be declared in dependencies or dev dependencies |
| Common dependencies | Validator, transformer, and metadata packages must be declared |
| Framework dependencies | Firebase package and <code>server-only</code> where required |
| Fireclass entry | Configured path must exist |
| Firebase entry | React or Express path must exist |
| Firebase export | Simple named variable/function export is inspected |
| Models directory | Configured directory is inspected |
| TypeScript decorators | Both required compiler flags are checked |

Passed checks do not affect exit status. Warnings still exit successfully.
Failed checks set exit code 1, making doctor suitable for CI.

Doctor does not connect to Firebase, compile application source, test Security
Rules or indexes, or execute models.

## fireclass list

~~~bash
fireclass list
fireclass ls
~~~

The command scans top-level TypeScript files in <code>models.dir</code>, excludes
<code>index.ts</code>, sorts by filename, and looks for a class extending
<code>BaseModel</code> plus a string-literal <code>@Collection</code>.

~~~text
User -> "users"  (user.ts)
~~~

Nested directories, computed collection names, decorator aliases, and unusual
formatting are not executed or deeply parsed. An empty models directory is not
an error.

## fireclass config

~~~bash
fireclass config
~~~

Prints the nearest project's parsed <code>fireclass.json</code>. It never
modifies the file and does not validate paths, exports, credentials, or the
public schema. Run doctor after manual changes.

## fireclass.json

Every generated configuration references the public schema:

~~~json
{
  "$schema": "https://fireclass.ayushdhar.com/schema.json",
  "version": "2.1.17",
  "framework": "react",
  "packageManager": "pnpm",
  "package": "@dharayush7/fireclass-react",
  "firebase": {
    "path": "src/lib/firebase.ts",
    "export": "db",
    "factory": false
  },
  "fireclass": {
    "path": "src/lib/fireclass.ts"
  },
  "models": {
    "dir": "src/models"
  }
}
~~~

Next.js uses <code>firebase: null</code>. Express normally records
<code>getDb</code> with <code>factory: true</code>. Configuration contains paths
and metadata only; never put Firebase credentials in this file.

## Import ownership

Keep generated local Fireclass files focused on app-bound values:

- <code>BaseModel</code>
- <code>adapter</code>
- <code>useQuery</code> and <code>useDoc</code> for React

Import decorators and standalone helpers directly from the runtime SDK:

~~~ts
import { Collection } from "@dharayush7/fireclass-js";
import { serialize, runAction } from "@dharayush7/fireclass-ssr";
import { ValidationFailedError } from "@dharayush7/fireclass-react";
~~~

## Documentation and examples

- [CLI overview](https://fireclass.ayushdhar.com/docs/cli)
- [init](https://fireclass.ayushdhar.com/docs/cli/init)
- [model](https://fireclass.ayushdhar.com/docs/cli/model)
- [doctor](https://fireclass.ayushdhar.com/docs/cli/doctor)
- [list](https://fireclass.ayushdhar.com/docs/cli/list)
- [config](https://fireclass.ayushdhar.com/docs/cli/config)
- [fireclass.json reference](https://fireclass.ayushdhar.com/docs/configuration/fireclass-json)
- [Express example](https://github.com/dharayush7/fireclass-cli/tree/main/example/fireclass-express-app)
- [Next.js example](https://github.com/dharayush7/fireclass-cli/tree/main/example/fireclass-next-app)
- [React example](https://github.com/dharayush7/fireclass-cli/tree/main/example/fireclass-react-app)

See [CHANGELOG.md](./CHANGELOG.md) for version history and
[RELEASE_NOTES.md](./RELEASE_NOTES.md) for the current release summary.

## License

MIT. Copyright Ayush Dhar.
