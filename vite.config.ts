/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import process from "node:process";
import { execSync } from "node:child_process";
const host = process.env.TAURI_DEV_HOST;

// Build details injected at build time (shown in the About panel after the
// version). Git may be absent (CI tarball, no repo) — degrade to null and the
// About panel simply omits the line. The ISO date is always available.
// ponytail: build-time git read, naive — a stale working tree isn't detected.
function buildInfo(): { commit: string; date: string } | null {
  try {
    const commit = execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return { commit, date: new Date().toISOString().slice(0, 10) };
  } catch {
    return null;
  }
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],

  // Replaced at build/dev/test start; read in AboutPanel. JSON.stringify so the
  // value inlines as a literal (or `null` when git is unavailable).
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo()),
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Vitest configuration: render hook/component tests into a DOM.
  test: {
    environment: "jsdom",
    globals: true,
    // Register jest-dom matchers once for every test file.
    setupFiles: ["./src/test-setup.ts"],
  },
}));
