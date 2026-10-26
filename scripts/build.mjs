// Builds the dashboard exactly the way the Grok Bot Page runtime expects it:
// src/App.tsx -> dist/app.js (imports from "grok/canvas" are provided as globals
// by the bundled canvas runtime; JSX compiles to React.createElement).
import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";

const src = await readFile("src/App.tsx", "utf8");
// Drop `import ... from "grok/canvas"` (value and type imports); the runtime exposes them on globalThis.
const stripped = src.replace(/import\s+(type\s+)?\{[^}]*\}\s+from\s+["']grok\/canvas["'];?/g, "");

await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
const out = await build({
  stdin: { contents: stripped, loader: "tsx", sourcefile: "App.tsx" },
  write: false,
  format: "esm",
  target: "es2020",
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
});
await writeFile("dist/app.js", out.outputFiles[0].text);
console.log("Built dist/app.js");
