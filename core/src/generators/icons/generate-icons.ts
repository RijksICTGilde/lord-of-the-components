#!/usr/bin/env npx tsx
/**
 * Generate icons.json — the icon vocabulary for validation. From:
 *   - the semantic aliases (definitions/icons.ts): name -> {rvo, nldd}
 *   - each theme's REAL icon set: RVO (@nl-rvo/assets/icons svgs) + NLDD
 *     (@nldd icon-registry map keys PLUS its own icon-aliases layer — both are
 *     names <nldd-icon> draws, and leaving out the second rejects 315 that work)
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

// NLDD: the names <nldd-icon name="..."> actually draws. That is TWO files —
// the drawn icons AND the design system's own friendly-name layer, which maps
// e.g. `download` -> `arrow-down-in-bucket`. Reading only the registry made the
// vocabulary too strict: 315 names that render fine were rejected in debug mode,
// and we told an application its working icon was broken. (The mirror image bit
// us at 0.8.80, when the list was too LOOSE and `folder-stack` pointed at an
// icon the bundle did not ship, so it rendered blank with every gate green.)
// Both files are what the shipped bundle is built from, so the vocabulary and
// the bundle cannot disagree.
const nlddIconDir = resolve(ROOT, "node_modules/@nldd/design-system/dist/components/content/icon");
const drawn = [
  ...new Set(
    [...readFileSync(resolve(nlddIconDir, "icon-registry.js"), "utf8")
      .matchAll(/\[\s*['"]([a-z0-9-]+)['"]\s*,/g)].map((m) => m[1]),
  ),
];
const nlddAliasSrc = readFileSync(resolve(nlddIconDir, "icon-aliases.js"), "utf8");
const nlddAliases = new Map(
  [...nlddAliasSrc.matchAll(/['"]([a-z0-9-]+)['"]\s*:\s*['"]([a-z0-9-]+)['"]/g)].map((m) => [m[1], m[2]]),
);
// An NLDD alias is only a usable name if its target is actually drawn.
const drawnSet = new Set(drawn);
const usableAliases = [...nlddAliases].filter(([, target]) => drawnSet.has(target)).map(([name]) => name);
const dangling = [...nlddAliases].filter(([, target]) => !drawnSet.has(target));
const nldd = [...new Set([...drawn, ...usableAliases])].sort();

const out = {
  aliases: ICON_ALIASES, // semantic name -> { rvo, nldd }
  sets: { rvo, nldd },
};
writeFileSync(resolve(ROOT, "python/src/lord_of_the_components/icons.json"), JSON.stringify(out) + "\n", "utf8");
console.log(
  `wrote icons.json: ${Object.keys(ICON_ALIASES).length} aliases, rvo=${rvo.length}, ` +
    `nldd=${nldd.length} (${drawn.length} drawn + ${usableAliases.length} NLDD aliases)`,
);
if (dangling.length) {
  // NLDD's own alias pointing at an icon it does not draw — not ours to fix,
  // but it would render blank, so say so rather than silently listing it.
  console.warn(`  ! ${dangling.length} NLDD aliases point at an icon that is not drawn: ` +
    dangling.slice(0, 5).map(([n, t]) => `${n}->${t}`).join(", "));
}
