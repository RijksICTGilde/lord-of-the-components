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
import { generateShowcase } from "./generate-showcase.js";
import { generatePythonRenderers, PYTHON_BACKEND, type CompImpl } from "../python/index.js";

// ── Imports from project root workspaces ─────────────────────────────────────
// These resolve via tsx at runtime (not compiled by tsc). All RVO impls come
// from the index (adding a component needs no third registration here).
import * as rvoImpls from "../../../../implementations/components/index.js";
import { COMPONENTS } from "../../../../definitions/components/index.js";
import * as nlddImpls from "../../../../themes/nldd/components/index.js";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Project root directory */
const PROJECT_ROOT = resolve(__dirname, "../../../..");

/** Core templates dir: system-layer templates, python-backend fallbacks, shared macros. */
const TEMPLATES_DIR = resolve(
  PROJECT_ROOT,
  "python/src/lord_of_the_components/templates/components",
);

/** RVO package templates dir: the RVO-specific jinja-backend component templates. */
const RVO_TEMPLATES_DIR = resolve(
  PROJECT_ROOT,
  "packages/lotc-rvo/src/lotc_rvo/templates/components",
);

/** Output path for registry.json (core owns the shared component contracts). */
const REGISTRY_PATH = resolve(
  PROJECT_ROOT,
  "python/src/lord_of_the_components/registry.json",
);

// ═══════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All available component implementations, discovered from the index and sorted
 * by component name for deterministic output.
 */
const implementations = (Object.values(rvoImpls) as CompImpl[])
  .filter((impl) => impl && impl.component && impl.root)
  .sort((a, b) => a.component.name.localeCompare(b.component.name));

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

function main(): void {
  const generator = new Jinja2Generator();

  // Ensure output directories exist
  mkdirSync(TEMPLATES_DIR, { recursive: true });
  mkdirSync(RVO_TEMPLATES_DIR, { recursive: true });

  console.log("Lord of the Components — Generate All");
  console.log("=====================================\n");

  // ── Generate Jinja2 templates ──────────────────────────────────────────
  // System-layer templates and the python-backend fallbacks (+ shared macros)
  // belong to core; the RVO-specific jinja-backend templates ship in lotc-rvo.
  console.log("Generating Jinja2 templates...\n");

  const SYSTEM = new Set(
    Object.values(COMPONENTS)
      .filter((c) => (c as { system?: boolean }).system)
      .map((c) => c.name),
  );

  let templateCount = 0;
  for (const impl of implementations) {
    const name = impl.component.name;
    const template = generator.generateTemplate(impl);
    const inCore = SYSTEM.has(name) || PYTHON_BACKEND.has(name);
    const dir = inCore ? TEMPLATES_DIR : RVO_TEMPLATES_DIR;
    writeFileSync(resolve(dir, `${name}.html.j2`), template, "utf-8");
    console.log(`  ✓ ${name}.html.j2 -> ${inCore ? "core" : "lotc-rvo"}`);
    templateCount++;
  }

  console.log(`\n  ${templateCount} template(s) generated.\n`);

  // ── Generate registry.json ─────────────────────────────────────────────
  console.log("Generating registry.json...\n");

  const allDefinitions = Object.values(COMPONENTS);
  const registryJSON = generateRegistryJSON(allDefinitions, PYTHON_BACKEND);

  mkdirSync(dirname(REGISTRY_PATH), { recursive: true });
  writeFileSync(REGISTRY_PATH, registryJSON, "utf-8");
  console.log(`  ✓ registry.json (${allDefinitions.length} component(s))\n`);

  // ── Generate the Python renderers for the python-backend components ────
  console.log("Generating Python renderers...\n");
  const pythonImpls = implementations.filter((impl) =>
    PYTHON_BACKEND.has(impl.component.name),
  ) as unknown as CompImpl[];
  const renderersPy = generatePythonRenderers(pythonImpls);
  const renderersPath = resolve(
    PROJECT_ROOT,
    "packages/lotc-rvo/src/lotc_rvo/renderers.py",
  );
  mkdirSync(dirname(renderersPath), { recursive: true });
  writeFileSync(renderersPath, renderersPy, "utf-8");
  console.log(`  ✓ lotc-rvo/renderers.py (${pythonImpls.length} renderer(s))\n`);

  // ── Generate the NLDD theme renderers ──────────────────────────────────
  const nlddList = Object.values(nlddImpls) as unknown as CompImpl[];
  const nlddPy = generatePythonRenderers(nlddList);
  const nlddPath = resolve(
    PROJECT_ROOT,
    "packages/lotc-nldd/src/lotc_nldd/renderers.py",
  );
  mkdirSync(dirname(nlddPath), { recursive: true });
  writeFileSync(nlddPath, nlddPy, "utf-8");
  console.log(`  ✓ lotc-nldd/renderers.py (${nlddList.length} renderer(s))\n`);

  // ── Generate showcase.html ───────────────────────────────────────────
  console.log("Generating showcase.html...\n");

  const showcaseHTML = generateShowcase(implementations);
  const showcasePath = resolve(
    PROJECT_ROOT,
    "examples/getting-started/templates/showcase.html",
  );
  mkdirSync(dirname(showcasePath), { recursive: true });
  writeFileSync(showcasePath, showcaseHTML, "utf-8");
  console.log(`  ✓ showcase.html\n`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("Done.");
  console.log(`  Templates: ${TEMPLATES_DIR}`);
  console.log(`  Registry:  ${REGISTRY_PATH}`);
  console.log(`  Showcase:  ${showcasePath}`);
}

main();
