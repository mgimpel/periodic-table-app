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
    { name: "anti-slop", specifier: "./submodules/anti-slop/src/index.ts"}
  ],
  rules: {
    "eslint/no-alert": "error",
    "oxc/no-accumulating-spread": "error",
    "anti-slop/no-array-filter-map": "error",
    "anti-slop/no-reduce-accumulator-copy": "error",
    //"anti-slop/no-chained-type-assertions": "error",
    //"anti-slop/no-conditional-empty-object-spread": "error",
    //"anti-slop/no-known-value-widening": "error",
    //"anti-slop/no-module-mocking": "error",
    //"anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    //"anti-slop/no-runtime-typeof": "error",
    "anti-slop/no-shape-in-symbol-names": "error",
    //"anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "error",
    "anti-slop/no-widen-then-assert": "error",
    //"anti-slop/require-readable-spacing": "error",
    //"anti-slop/require-safety-comment-for-type-assertion": "error"
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
