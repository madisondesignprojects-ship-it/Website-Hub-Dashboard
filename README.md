# Website Hub Dashboard

Jacob's sales-walk dashboard ("Website Hub: Current Sites vs. Demos"): the Thursday walk route, every stop's demo vs. current site, weekly hours with a live open/closed status (Central time), and the list of completed sites.

Built with Vite + React + TypeScript. Deployed on Vercel (project `website-hub-dashboard`, team mdp-solo); every push to `main` deploys to production.

## Edit the data
All content lives in `src/App.tsx`:
- `BIZ` — walk stops and "Another day" stops (route, times, hours, demo/current site, repo, notes).
- `SITES` — the "Completed sites" table.

`src/kit.tsx` holds the small set of UI components (Page, Section, Table, Button, …) and the light/dark theme.

## Saved in the browser
Reordering (Up/Down) and removing stops are saved in `localStorage` on the device you use. "Restore removed" and "Reset order" undo them. Stops added to `BIZ` later show up automatically at the end of a saved order.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve dist/
```
