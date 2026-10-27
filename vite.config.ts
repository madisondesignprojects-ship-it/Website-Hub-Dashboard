import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `vite build --mode pages` builds for GitHub Pages (served from /Website-Hub-Dashboard/); Vercel serves from /.
export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/Website-Hub-Dashboard/" : "/",
  plugins: [react()],
}));
