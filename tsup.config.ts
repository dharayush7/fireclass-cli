import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  target: "node18",
  clean: true,
  sourcemap: false,
  minify: false,
  // Keep the shebang from src/index.ts and mark the output executable.
  banner: { js: "#!/usr/bin/env node" },
});
