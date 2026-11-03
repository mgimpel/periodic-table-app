import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "typescript", "unicorn"],
  env: {
    browser: true,
    es2024: true,
  },
  categories: {
    correctness: "error",
  },
  ignorePatterns: ["dist", "node_modules", "src-tauri/target"],
  overrides: [
    {
      files: ["vite.config.ts"],
      rules: {
        // The triple-slash reference is the standard way to type Vitest's
        // `test` field in vite.config.ts; it is backed by the matching import.
        "typescript/triple-slash-reference": "off",
      },
    },
  ],
});
