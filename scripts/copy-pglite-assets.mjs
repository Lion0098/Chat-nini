import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const src = join("node_modules", "@electric-sql", "pglite", "dist");
const dest = join(".vercel", "output", "functions", "__server.func", "_libs");
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

if (!existsSync(dest)) {
  console.log("[pglite] bundle dir missing, skip");
  process.exit(0);
}

for (const file of files) {
  const from = join(src, file);
  if (!existsSync(from)) {
    console.error(`[pglite] missing ${from}`);
    process.exit(1);
  }
  copyFileSync(from, join(dest, file));
}
console.log("[pglite] copied wasm assets next to the server bundle");
