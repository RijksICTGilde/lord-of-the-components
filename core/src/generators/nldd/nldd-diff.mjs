#!/usr/bin/env node
/**
 * Preview what a new NLDD version changes in OUR mapped surface. Run after
 * bumping @nldd/design-system (installed = new) but before `gen:nldd`
 * (committed = old): it diffs the freshly-built fragment against the committed
 * one and prints a grouped summary (added / removed / changed components +
 * per-component attribute changes), so you see exactly what to review/adopt.
 */
import { readFileSync, existsSync } from "node:fs";
import { buildOutputs, FRAGMENT, NLDD_VERSION } from "./generate-nldd.mjs";

const fresh = buildOutputs().fragment;
const committed = existsSync(FRAGMENT)
  ? JSON.parse(readFileSync(FRAGMENT, "utf8"))
  : { meta: {}, components: [] };

const byName = (a) => new Map(a.map((c) => [c.name, c]));
const A = byName(committed.components), B = byName(fresh.components);
const added = [...B.keys()].filter((n) => !A.has(n));
const removed = [...A.keys()].filter((n) => !B.has(n));
const changed = [...B.keys()].filter((n) => A.has(n) && JSON.stringify(A.get(n)) !== JSON.stringify(B.get(n)));

console.log(`NLDD: ${committed.meta?.nldd_version || "?"} (committed) -> ${NLDD_VERSION} (installed)`);
console.log(`Components: ${committed.components.length} -> ${fresh.components.length}`);
if (added.length) console.log(`  + added (${added.length}): ${added.join(", ")}`);
if (removed.length) console.log(`  - removed (${removed.length}): ${removed.join(", ")}`);
if (changed.length) {
  console.log(`  ~ changed (${changed.length}):`);
  for (const n of changed) {
    const a = new Map((A.get(n).attributes || []).map((x) => [x.name, x]));
    const b = new Map((B.get(n).attributes || []).map((x) => [x.name, x]));
    const add = [...b.keys()].filter((k) => !a.has(k));
    const rem = [...a.keys()].filter((k) => !b.has(k));
    const chg = [...b.keys()].filter((k) => a.has(k) && JSON.stringify(a.get(k)) !== JSON.stringify(b.get(k)));
    const bits = [add.length && `+attr ${add.join(",")}`, rem.length && `-attr ${rem.join(",")}`, chg.length && `~attr ${chg.join(",")}`].filter(Boolean);
    console.log(`      ${n}: ${bits.join("; ") || "changed"}`);
  }
}
if (!added.length && !removed.length && !changed.length) console.log("  (no component changes)");
console.log(`\nApply with: npm run nldd:update  (gen:nldd + gen:icons + gen:docs)`);
