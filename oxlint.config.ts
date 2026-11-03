import { defineConfig } from "oxlint";

export default defineConfig({
  options: {
    typeAware: true,
  },
  plugins: [
    "react",
    "typescript",
    "unicorn",
    "oxc",
    //"vitest",
  ],
  jsPlugins: [
    //{ name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts"}
  ],
  rules: {
    "eslint/no-alert": "error",
    "oxc/no-accumulating-spread": "error",
  },
  env: {
    browser: true,
    es2024: true,
  },
  categories: {
    correctness: "error",
    //suspicious: "warn",
  },
  ignorePatterns: [
    ".agents",
    ".kiro",
    ".vscode",
    "dist",
    "node_modules",
    "src-tauri/target",
  ],
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
