// Moon's Kitchen rule checker. Run from the project root:
//   node .claude/skills/moonskitchen-rules/scripts/check.mjs
// Prints PASS / FAIL / WARN. Reads files only; changes nothing.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

let fails = 0;
const ok = (cond, name, detail = "") => {
  if (!cond) fails++;
  console.log((cond ? "PASS  " : "FAIL  ") + name + (cond || !detail ? "" : "  ->  " + detail));
};
const warn = (cond, name, detail) => { if (!cond) console.log("WARN  " + name + "  ->  " + detail); };
const read = (f) => readFileSync(f, "utf8").replace(/\r\n/g, "\n");
if (!existsSync("index.html") || !existsSync("js/script.js")) {
  console.error("Run this from the Moon's Kitchen project root.");
  process.exit(2);
}
// Google Search Console verification files (googleXXXX.html) are not pages
const pages = readdirSync(".").filter((f) => f.endsWith(".html") && !/^google[0-9a-f]+\.html$/.test(f));
const html = Object.fromEntries(pages.map((f) => [f, read(f)]));
const js = readdirSync("js").filter((f) => f.endsWith(".js"));
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&ndash;/g, "–");

// Code
for (const f of [...js.map((f) => "js/" + f), ...["functions", "lib"].flatMap((d) => readdirSync("netlify/" + d).map((f) => `netlify/${d}/${f}`))]) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); } catch { ok(false, "syntax", f); }
}
ok(true, "JavaScript syntax checked");

// Ordering
const number = (read("js/script.js").match(/WHATSAPP_NUMBER = "(\d+)"/) || [])[1];
ok(!!number, "WhatsApp number set in js/script.js");
const strays = [...pages, ...js.map((f) => "js/" + f).filter((f) => f !== "js/script.js")].filter((f) => number && read(f).includes(number));
ok(!strays.length, "WhatsApp number only in js/script.js", strays.join(", "));
const home = html["index.html"];
ok(!/data-item="a chat"/.test(home), 'no "order a chat" buttons');
const onPage = new Set([...home.matchAll(/class="(?:order-btn|tile)[^"]*" data-item="([^"]+)"/g)].map((m) => decode(m[1])));
const cart = read("js/cart.js");
const block = cart.slice(cart.indexOf("var MENU"), cart.indexOf("];\n", cart.indexOf("var MENU")));
const menu = new Set([...block.matchAll(/items: \[([\s\S]*?)\]/g)].flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])));
const diff = [...onPage].filter((n) => !menu.has(n)).concat([...menu].filter((n) => !onPage.has(n)));
ok(onPage.size > 0 && !diff.length, "item names match between home page and Order page", diff.join(", "));
const pos = (s) => home.indexOf(`src="js/${s}"`);
ok(pos("script.js") > 0 && pos("script.js") < pos("cart.js") && pos("cart.js") < pos("order.js"), "script order: script, cart, order");
ok(/id="basketFab"/.test(home) && /data-cart-count/.test(home), "bag icon and bottom basket button present");

// Look and words
for (const f of ["css/order.css", "css/new-design.css"].filter(existsSync)) {
  const hex = read(f).replace(/\/\*[\s\S]*?\*\//g, "").match(/#[0-9a-f]{3,8}\b(?=[\s;,)])/gi) || [];
  ok(!hex.length, "no hex colours in " + f, hex.join(", "));
}
ok(/DEFAULT_THEME = "caramel"/.test(read("js/theme.js")), "default theme is caramel");
ok(!/₹\s*\d|&#8377;\s*\d|Rs\.?\s*\d/.test(home + (html["order.html"] || "")), "no prices on the home or Order page");
for (const f of pages) {
  const n = (html[f].match(/<h1\b/g) || []).length;
  if (f === "login.html") warn(n === 1, "one h1", `${f} has ${n}`); else ok(n === 1, `one h1 in ${f}`, "found " + n);
  const noAlt = (html[f].match(/<img\b[^>]*>/g) || []).filter((t) => !/\balt=/.test(t));
  ok(!noAlt.length, `every image has alt in ${f}`, noAlt[0]);
  const gone = [...html[f].matchAll(/(?:src|href)="((?:js|css|assets)\/[^"#?]+|[\w-]+\.html)(?:[#?][^"]*)?"/g)].map((m) => m[1]).filter((p) => !existsSync(p));
  ok(!gone.length, `no broken local links in ${f}`, gone.join(", "));
}
const ld = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
try { JSON.parse(ld[1]); ok(true, "structured data is valid"); } catch { ok(false, "structured data is valid"); }
for (const f of readdirSync("assets/images").filter((f) => /\.webp$/.test(f))) {
  const kb = Math.round(statSync(join("assets/images", f)).size / 1024);
  warn(kb <= 200, "photo under 200 KB", `${f} is ${kb} KB`);
}

// Safety
const code = [...js.map((f) => "js/" + f), ...pages, ...["functions", "lib"].flatMap((d) => readdirSync("netlify/" + d).map((f) => `netlify/${d}/${f}`))];
const secret = code.filter((f) => /sb_secret_[A-Za-z0-9]{8}|xkeysib-|eyJhbGciOi|IGAA[A-Za-z0-9]{12}|SECRET\w*\s*=\s*["'][^"']{8}/.test(read(f)));
ok(!secret.length, "no secrets in files", secret.join(", "));
if (existsSync("netlify/functions/admin.mjs")) ok(/if \(!user\.isAdmin\)/.test(read("netlify/functions/admin.mjs")), "admin function checks the owner on the server");
if (existsSync("netlify/functions/reviews.mjs")) ok(/columns: "display_name,rating,comment,item_summary,created_at"/.test(read("netlify/functions/reviews.mjs")), "public reviews send no customer emails");
ok(/url\.origin === window\.location\.origin/.test(read("js/login.js")), "login redirect stays on this site");
ok(/noindex/.test(html["admin.html"] || "noindex"), "admin page hidden from Google");
const build = read("scripts/build.mjs");
const unbuilt = pages.filter((f) => !build.includes(`"${f}"`));
ok(!unbuilt.length, "every page is in the build list", unbuilt.join(", "));

console.log(fails ? `\n${fails} rule(s) broken.` : "\nAll rules followed.");
process.exit(fails ? 1 : 0);
