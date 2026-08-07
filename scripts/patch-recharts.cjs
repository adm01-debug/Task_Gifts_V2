#!/usr/bin/env node
/**
 * Idempotent patch: silences recharts ResponsiveContainer "fixed numbers" warning.
 *
 * Background: every ResponsiveContainer in this codebase is wrapped in a flexible
 * parent (h-64, h-[300px], aspect-video, grid columns) and intentionally uses
 * width="100%" height="100%". The recharts dev warning fires anyway when the
 * parent resolves to fixed pixel dimensions (501×192, 1036×192, 455×256, …)
 * and the message is noisy without being actionable.
 *
 * Reapply after every `npm install` (wired via package.json `postinstall`).
 */

const fs = require("node:fs");
const path = require("node:path");

const MARKER = "// project-patch: recharts-suppress-fixed-numbers-warning";

const FILES = [
  "node_modules/recharts/lib/util/LogUtils.js",
  "node_modules/recharts/es6/util/LogUtils.js",
];

const PATCH = `        ${MARKER}
        if (msg.indexOf("maybe you don't need to use a ResponsiveContainer") !== -1) {
          return;
        }
        console.warn(msg);`;

const ANCHOR = "console.warn(msg);";

let changed = 0;
let skipped = 0;

for (const rel of FILES) {
  const abs = path.resolve(__dirname, "..", rel);
  if (!fs.existsSync(abs)) {
    console.warn(`[patch-recharts] not found: ${rel}`);
    continue;
  }
  const src = fs.readFileSync(abs, "utf8");
  if (src.includes(MARKER)) {
    skipped++;
    continue;
  }
  if (!src.includes(ANCHOR)) {
    console.warn(`[patch-recharts] anchor missing in ${rel}, skipping`);
    continue;
  }
  const next = src.replace(ANCHOR, PATCH);
  fs.writeFileSync(abs, next, "utf8");
  changed++;
  console.log(`[patch-recharts] patched ${rel}`);
}

if (changed === 0 && skipped > 0) {
  console.log("[patch-recharts] already up to date");
}