#!/usr/bin/env npx tsx
/**
 * Generate the RVO Python renderers (plan v7 F3).
 *
 * Emits packages/lotc-rvo/src/lotc_rvo/renderers.py for the components currently
 * on the Python backend. Run via tsx (excluded from tsc because it imports
 * across the workspace boundary).
 *
 * Usage: npx tsx core/src/generators/python/generate-python.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { generatePythonRenderers, PYTHON_BACKEND, type CompImpl } from "./index.js";
import * as impls from "../../../../implementations/components/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../../..");
const OUTPUT = resolve(
  PROJECT_ROOT,
  "packages/lotc-rvo/src/lotc_rvo/renderers.py",
);

function main(): void {
  const all = Object.values(impls) as unknown as CompImpl[];
  const selected = all
    .filter((impl) => impl && impl.component && PYTHON_BACKEND.has(impl.component.name))
    .sort((a, b) => a.component.name.localeCompare(b.component.name));

  const module = generatePythonRenderers(selected);
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, module, "utf-8");
  console.log(`Wrote ${OUTPUT}`);
  console.log(`  ${selected.length} renderers: ${selected.map((i) => i.component.name).join(", ")}`);
}

main();
