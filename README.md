# Website Hub Dashboard

Standalone copy of the Grok Bot Page "Website Hub: Current Sites vs. Demos" (Thursday walk route dashboard).

- `src/App.tsx` — the dashboard source, unchanged from the Page. Edit data (BIZ, SITES) and layout here.
- `public/canvas-runtime-grok.esm.js` — the same UI runtime the Page uses (React + Page/Section/Table/etc. components), so it renders identically.
- `npm run build` → `dist/` (static). Vercel runs this automatically on every push to `main`.
