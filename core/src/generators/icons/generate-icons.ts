#!/usr/bin/env npx tsx
/**
 * Generate icons.json — the icon vocabulary for validation. From:
 *   - the semantic aliases (definitions/icons.ts): name -> {rvo, nldd}
 *   - each theme's REAL icon set: RVO (@nl-rvo/assets/icons svgs) + NLDD
 *     (@nldd icon-registry map keys)
 * so <c-icon icon="X"> can be validated per active theme (catches typos and
 * icons that only exist in one theme -> the "blue box" bug).
 *
 * Run:  npx tsx core/src/generators/icons/generate-icons.ts  ->  python/.../icons.json
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ICON_ALIASES } from "../../../../definitions/icons.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

// RVO: every icon SVG basename under the assets tree
const rvoDir = resolve(ROOT, "node_modules/@nl-rvo/assets/icons");
const walk = (d: string, acc: string[] = []): string[] => {
  for (const f of readdirSync(d)) {
    const p = resolve(d, f);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (f.endsWith(".svg")) acc.push(f.replace(/\.svg$/, ""));
  }
  return acc;
};
const rvo = [...new Set(walk(rvoDir))].sort();

// NLDD: the icon-registry Map keys
const nlddSrc = readFileSync(
  resolve(ROOT, "node_modules/@nldd/design-system/dist/components/content/icon/icon-registry.js"),
  "utf8",
);
const nldd = [...new Set([...nlddSrc.matchAll(/\[\s*['"]([a-z0-9-]+)['"]\s*,/g)].map((m) => m[1]))].sort();

const out = {
  aliases: ICON_ALIASES, // semantic name -> { rvo, nldd }
  sets: { rvo, nldd },
};
writeFileSync(resolve(ROOT, "python/src/lord_of_the_components/icons.json"), JSON.stringify(out) + "\n", "utf8");
console.log(`wrote icons.json: ${Object.keys(ICON_ALIASES).length} aliases, rvo=${rvo.length}, nldd=${nldd.length}`);
