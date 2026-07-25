#!/usr/bin/env node
/**
 * Fail if built frontend assets contain long-lived Gemini key material or env names.
 * Usage: node scripts/scan-frontend-secrets.mjs [dir]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] || "apps/web/.next";
const patterns = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /GEMINI_API_KEY\s*[:=]/g,
  /x-goog-api-key/gi,
  /auth_tokens\/[A-Za-z0-9._-]{20,}/g,
];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    console.error(`scan-frontend-secrets: missing dir ${dir} (build first or pass path)`);
    process.exit(2);
  }
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|html|txt|json|css|map)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(root);
const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const re of patterns) {
    re.lastIndex = 0;
    if (re.test(text)) hits.push({ file, pattern: String(re) });
  }
}

if (hits.length) {
  console.error("SECRET SCAN FAILED:");
  for (const h of hits.slice(0, 20)) console.error(`  ${h.file} ~ ${h.pattern}`);
  process.exit(1);
}
console.log(`SECRET SCAN OK (${files.length} files under ${root})`);
