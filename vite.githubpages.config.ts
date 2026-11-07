import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";

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
  base: 'https://www.gimpel.org/periodic-table-app/',

  // Replaced at build/dev/test start; read in AboutPanel. JSON.stringify so the
  // value inlines as a literal (or `null` when git is unavailable).
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo()),
  }

}));
