import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build`         -> dist/ (multi-file, ideal for GitHub Pages / Vercel / Netlify)
// `npm run build:single`  -> dist-single/index.html (everything inlined in ONE file)
export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    base: "./",
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    test: { environment: "jsdom", globals: true, setupFiles: "./test/setup.js", css: false, testTimeout: 20000 },
    build: { outDir: single ? "dist-single" : "dist", assetsInlineLimit: single ? 100000000 : 4096 },
  };
});
