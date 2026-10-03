import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  minify: true,
  keepNames: true,
  noExternal: [/^shared/, /^@taskly\//, "nanoid"],
});
