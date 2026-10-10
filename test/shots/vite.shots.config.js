import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
// visual-check build: swaps the real Supabase layer for an in-memory stand-in
export default defineConfig({
  root: path.resolve(here, "../.."),
  base: "./",
  plugins: [react()],
  resolve: { alias: [{ find: /^.*\/api\/supa(\.js)?$/, replacement: path.resolve(here, "fakeBrowser.js") }] },
  build: { outDir: path.resolve(here, "dist"), emptyOutDir: true },
});
