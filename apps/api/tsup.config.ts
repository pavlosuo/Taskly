import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  minify: "terser",
  terserOptions: {
    compress: {
      passes: 2,
      dead_code: true,
      unused: true,
      drop_debugger: true,
    },
    mangle: true,
    format: {
      comments: false,
    },
  },
  noExternal: [/^shared/, /^@taskly\//, "nanoid", "file-type"],
});
