#!/usr/bin/env npx tsx
/**
 * Generate the variant matrix (plan v7 T1.0).
 *
 * Imports every component implementation and writes core/dist/matrix.json —
 * the single source of cases for goldens, fixtures, docs and coverage.
 *
 * Usage:
 *   npx tsx core/src/matrix/generate-matrix.ts
 *
 * Excluded from the tsc build (like generate-all.ts) because it imports across
 * the workspace boundary; run via tsx.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMatrix,
  findUncovered,
  renderComponentsMarkdown,
  renderCoverageMarkdown,
  type CompImpl,
} from "./index.js";
import * as impls from "../../../implementations/components/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../..");
const OUTPUT_PATH = resolve(PROJECT_ROOT, "core/dist/matrix.json");
const COMPONENTS_MD = resolve(PROJECT_ROOT, "COMPONENTS.md");
const COVERAGE_MD = resolve(PROJECT_ROOT, "COVERAGE.md");

function main(): void {
  // Deterministic order: sort implementations by component name.
  const implementations = (Object.values(impls) as unknown as CompImpl[])
    .filter((impl) => impl && impl.component && impl.root)
    .sort((a, b) => a.component.name.localeCompare(b.component.name));

  const matrix = buildMatrix(implementations, "rvo");

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(matrix, null, 2) + "\n", "utf-8");
  writeFileSync(COMPONENTS_MD, renderComponentsMarkdown(implementations, "rvo"), "utf-8");
  writeFileSync(COVERAGE_MD, renderCoverageMarkdown(implementations, "rvo"), "utf-8");

  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Wrote ${COMPONENTS_MD}`);
  console.log(`Wrote ${COVERAGE_MD}`);
  console.log(`  ${implementations.length} components, ${matrix.cases.length} cases`);

  // Report coverage gaps (informational in F1; a hard gate lands with COVERAGE.md).
  let gaps = 0;
  for (const impl of implementations) {
    const uncovered = findUncovered(impl);
    if (uncovered.length) {
      gaps += uncovered.length;
      console.log(`  ! ${impl.component.name}: uncovered ${uncovered.join(", ")}`);
    }
  }
  if (gaps === 0) console.log("  coverage: every enum value / boolean / IR value has a case");
}

main();
