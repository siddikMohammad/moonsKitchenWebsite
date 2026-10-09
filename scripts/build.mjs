// Copies only the files the live site needs into dist/ (the folder Netlify
// publishes), so backups and README stay private.
// Run with:  npm run build
import { cpSync, rmSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "dist";
const INCLUDE = ["index.html", "login.html", "privacy.html", "css", "js", "assets"];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const item of INCLUDE) {
  cpSync(item, join(OUT, item), { recursive: true });
}

let files = 0, bytes = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else { files++; bytes += s.size; }
  }
})(OUT);
console.log(`Built ${OUT}/: ${files} files, ${(bytes / 1024).toFixed(0)} KB`);
