#!/usr/bin/env node
/**
 * Extract assets that the NLDD bundle owns but only exposes inside its
 * JavaScript, so an application can serve them as files.
 *
 * Today that is one: the coat of arms, which lives as an inline SVG inside
 * `nldd-top-navigation-bar`. An application that builds its own header — a
 * toolbar with the arms in `nldd-toolbar-title`'s `media` slot — cannot reach
 * it, so it ends up copying the SVG by hand. That copy then drifts silently:
 * the design system redraws the mark, the application keeps the old one, and
 * nothing fails (reported by RIG-Cluster, RC-151).
 *
 * Extracted from the PINNED package, written next to (not inside) dist/, which
 * webpack cleans on every build. `--check` fails when the file and the bundle
 * have drifted apart, so a version bump either updates it or says so.
 *
 * Run:  node core/src/generators/nldd/extract-assets.mjs [--check]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SOURCE = resolve(ROOT, "node_modules/@nldd/design-system/dist/nldd.min.js");
const OUT_DIR = resolve(ROOT, "packages/lotc-nldd/src/lotc_nldd/static/lotc/nldd");

/** Assets to lift out, each identified by something only it contains. */
const ASSETS = [
  {
    file: "rijkswapen.svg",
    // The arms are the only 50x100 SVG in the bundle, and the only thing
    // painted in the deep blue of the national identity.
    marker: 'viewBox="0 0 50 100"',
    describe: "the coat of arms from nldd-top-navigation-bar",
  },
];

function extract(source, marker) {
  const at = source.indexOf(marker);
  if (at === -1) return null;
  const start = source.lastIndexOf("<svg", at);
  const end = source.indexOf("</svg>", at);
  if (start === -1 || end === -1) return null;
  return source.slice(start, end + "</svg>".length);
}

function main() {
  const check = process.argv.includes("--check");
  if (!existsSync(SOURCE)) {
    console.error(`✗ ${SOURCE} not found — is @nldd/design-system installed?`);
    process.exit(1);
  }
  const source = readFileSync(SOURCE, "utf8");
  const stale = [];
  for (const asset of ASSETS) {
    const svg = extract(source, asset.marker);
    if (!svg) {
      console.error(`✗ could not find ${asset.file} (${asset.describe}) in the bundle`);
      process.exit(1);
    }
    const target = resolve(OUT_DIR, asset.file);
    const content = svg + "\n";
    if (check) {
      if (!existsSync(target) || readFileSync(target, "utf8") !== content) stale.push(asset.file);
      continue;
    }
    writeFileSync(target, content, "utf8");
    console.log(`wrote ${asset.file} (${content.length} bytes) — ${asset.describe}`);
  }
  if (check) {
    if (stale.length) {
      console.error(`✗ extracted assets differ from the bundle: ${stale.join(", ")}`);
      console.error(`  run \`npm run gen:nldd-assets\``);
      process.exit(1);
    }
    console.log(`✓ ${ASSETS.length} extracted asset(s) match the bundle`);
  }
}

main();
