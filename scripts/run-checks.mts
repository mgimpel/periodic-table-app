// Runs every `src/**/*.check.ts` self-check under vite-node (so TS + Vite
// resolution Just Work), failing the process if any check throws.
// The list grows automatically as modules add their own `*.check.ts`.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { glob } from "node:fs/promises";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const checks: string[] = [];

for await (const file of glob("src/**/*.check.ts", { cwd: projectRoot })) {
  checks.push(file);
}

checks.sort();

if (checks.length === 0) {
  console.log("No *.check.ts files found yet.");
} else {
  for (const file of checks) {
    await import(resolve(projectRoot, file));
    console.log(`ok  ${file}`);
  }

  console.log(`\n${checks.length} self-check(s) passed.`);
}
