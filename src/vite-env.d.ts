/// <reference types="vite/client" />

// Injected by Vite's `define` (see vite.config.ts). Null when git is
// unavailable at build time, so the About panel omits the build line.
declare const __BUILD_INFO__: { commit: string; date: string } | null;
