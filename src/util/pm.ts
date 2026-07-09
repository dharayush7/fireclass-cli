import { spawn } from "node:child_process";
import type { PackageManager } from "../detect";

/** Build the install command + args for a package manager. */
export function installCommand(
  pm: PackageManager,
  deps: string[],
): { cmd: string; args: string[] } {
  switch (pm) {
    case "pnpm":
      return { cmd: "pnpm", args: ["add", ...deps] };
    case "yarn":
      return { cmd: "yarn", args: ["add", ...deps] };
    case "bun":
      return { cmd: "bun", args: ["add", ...deps] };
    case "npm":
      return { cmd: "npm", args: ["install", ...deps] };
  }
}

/** Injectable runner so tests don't spawn real installs. */
export type CommandRunner = (
  cmd: string,
  args: string[],
  cwd: string,
) => Promise<number>;

const defaultRunner: CommandRunner = (cmd, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });

/** Install dependencies with the given package manager. */
export async function installDeps(
  pm: PackageManager,
  deps: string[],
  cwd: string,
  runner: CommandRunner = defaultRunner,
): Promise<void> {
  if (deps.length === 0) return;
  const { cmd, args } = installCommand(pm, deps);
  const code = await runner(cmd, args, cwd);
  if (code !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited with code ${code}`);
  }
}
