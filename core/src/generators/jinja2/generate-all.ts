#!/usr/bin/env npx tsx
/**
 * Generate-All CLI Script
 *
 * Generates all Jinja2 templates and the component registry JSON.
 *
 * For each registered implementation:
 *   1. Generates a `.html.j2` template via Jinja2Generator
 *   2. Writes it to python/src/lord_of_the_components/templates/components/
 *
 * Also generates registry.json from all component definitions.
 *
 * Usage:
 *   npx tsx core/src/generators/jinja2/generate-all.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Imports from sibling modules (within core/src/) ──────────────────────────
import { Jinja2Generator } from "./index.js";
import { generateRegistryJSON } from "./generate-registry.js";

// ── Imports from project root workspaces ─────────────────────────────────────
// These resolve via tsx at runtime (not compiled by tsc).
import { buttonImpl } from "../../../../implementations/components/button.impl.js";
import { headingImpl } from "../../../../implementations/components/heading.impl.js";
import { iconImpl } from "../../../../implementations/components/icon.impl.js";
import { cardImpl } from "../../../../implementations/components/card.impl.js";
import { dataListImpl } from "../../../../implementations/components/data-list.impl.js";
import { layoutFlowImpl } from "../../../../implementations/components/layout-flow.impl.js";
import { layoutColumnImpl } from "../../../../implementations/components/layout-column.impl.js";
import { layoutRowImpl } from "../../../../implementations/components/layout-row.impl.js";
import { maxWidthLayoutImpl } from "../../../../implementations/components/max-width-layout.impl.js";
import { gridImpl } from "../../../../implementations/components/grid.impl.js";
import { paragraphImpl } from "../../../../implementations/components/paragraph.impl.js";
import { linkImpl } from "../../../../implementations/components/link.impl.js";
import { labelImpl } from "../../../../implementations/components/label.impl.js";
import { strongImpl } from "../../../../implementations/components/strong.impl.js";
import { emImpl } from "../../../../implementations/components/em.impl.js";
import { alertImpl } from "../../../../implementations/components/alert.impl.js";
import { headerImpl } from "../../../../implementations/components/header.impl.js";
import { heroImpl } from "../../../../implementations/components/hero.impl.js";
import { footerImpl } from "../../../../implementations/components/footer.impl.js";
import { menuImpl } from "../../../../implementations/components/menu.impl.js";
import { COMPONENTS } from "../../../../definitions/components/index.js";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Project root directory */
const PROJECT_ROOT = resolve(__dirname, "../../../..");

/** Output directory for generated Jinja2 templates */
const TEMPLATES_DIR = resolve(
  PROJECT_ROOT,
  "python/src/lord_of_the_components/templates/components",
);

/** Output path for registry.json */
const REGISTRY_PATH = resolve(
  PROJECT_ROOT,
  "python/src/lord_of_the_components/registry.json",
);

// ═══════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All available component implementations.
 * Add new implementations here as they are created.
 */
const implementations = [
  buttonImpl,
  headingImpl,
  iconImpl,
  cardImpl,
  dataListImpl,
  layoutFlowImpl,
  layoutColumnImpl,
  layoutRowImpl,
  maxWidthLayoutImpl,
  gridImpl,
  paragraphImpl,
  linkImpl,
  labelImpl,
  strongImpl,
  emImpl,
  alertImpl,
  headerImpl,
  heroImpl,
  footerImpl,
  menuImpl,
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

function main(): void {
  const generator = new Jinja2Generator();

  // Ensure output directory exists
  mkdirSync(TEMPLATES_DIR, { recursive: true });

  console.log("Lord of the Components — Generate All");
  console.log("=====================================\n");

  // ── Generate Jinja2 templates ──────────────────────────────────────────
  console.log("Generating Jinja2 templates...\n");

  let templateCount = 0;
  for (const impl of implementations) {
    const name = impl.component.name;
    const template = generator.generateTemplate(impl);
    const outputPath = resolve(TEMPLATES_DIR, `${name}.html.j2`);

    writeFileSync(outputPath, template, "utf-8");
    console.log(`  ✓ ${name}.html.j2`);
    templateCount++;
  }

  console.log(`\n  ${templateCount} template(s) generated.\n`);

  // ── Generate registry.json ─────────────────────────────────────────────
  console.log("Generating registry.json...\n");

  const allDefinitions = Object.values(COMPONENTS);
  const registryJSON = generateRegistryJSON(allDefinitions);

  mkdirSync(dirname(REGISTRY_PATH), { recursive: true });
  writeFileSync(REGISTRY_PATH, registryJSON, "utf-8");
  console.log(`  ✓ registry.json (${allDefinitions.length} component(s))\n`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("Done.");
  console.log(`  Templates: ${TEMPLATES_DIR}`);
  console.log(`  Registry:  ${REGISTRY_PATH}`);
}

main();
