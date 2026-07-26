/**
 * Showcase Generator
 *
 * Reads component definitions + implementations and generates a comprehensive
 * HTML showcase file using <c-*> tags. The output is a plain .html file that
 * gets processed through the Jinja2 pipeline.
 *
 * Every enum value and boolean prop is represented, so the showcase is always
 * in sync with the actual component definitions.
 */

import type { ComponentDefinition, PropSpec } from "../../../../definitions/component.js";
import type { ComponentImplementation } from "../../../../implementations/implementation.js";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Props that are plumbing/styling — don't showcase their variants */
const SKIP_PROPS = new Set([
  "class",
  "aria-label",
  "aria-describedby",
  "href",
  "target",
  "html-type",
  "role",
  "name",
  "for",
  "id",
  "icon-aria-label",
  "icon-color",
  "icon-size",
  "lang",
  "charset",
  "description",
  "theme",
  "body-class",
  "head",
  "link",         // header link prop
  "division",     // grid custom division
  "image",        // card/hero image URL
  "image-alt",
  "background-image",
  "background-color",
  "title",        // card/hero/page title — shown structurally
  "subtitle",     // hero/header subtitle — shown structurally
  "text",         // header text — shown structurally
  "pay-off",      // footer pay-off — shown structurally
  "heading",      // alert heading — shown structurally
]);

/** Components demonstrated structurally (page wrapper, layout containers) — not demoed in isolation */
const STRUCTURAL_COMPONENTS = new Set([
  "page",
  "header",
  "hero",
  "footer",
  "layout-flow",
  "layout-column",
  "layout-row",
  "max-width-layout",
  "grid",
]);

/** Components shown inline within text — not demoed as standalone sections */
const INLINE_COMPONENTS = new Set([
  "strong",
  "em",
]);

/** Known icon names for demo purposes */
const DEMO_ICONS = ["vinkje", "kruis", "info", "waarschuwing", "delta-omlaag", "huis", "zoek", "telefoon"];

/** Category display order and labels */
const CATEGORY_ORDER: [string, string][] = [
  ["actions", "Actions"],
  ["feedback", "Feedback"],
  ["navigation", "Navigation"],
  ["data-display", "Data Display"],
  ["visual", "Visual"],
  ["typography", "Typography"],
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build a <c-*> tag string */
function tag(
  name: string,
  attrs: Record<string, string | boolean>,
  content?: string,
  selfClosing = false,
): string {
  const parts = [`<c-${name}`];
  for (const [key, val] of Object.entries(attrs)) {
    if (val === true) {
      parts.push(` ${key}`);
    } else if (val !== false && val !== "") {
      parts.push(` ${key}="${escapeHtml(val)}"`);
    }
  }
  if (selfClosing && !content) {
    parts.push("/>");
    return parts.join("");
  }
  parts.push(">");
  if (content) {
    parts.push(content);
  }
  parts.push(`</c-${name}>`);
  return parts.join("");
}

function indent(text: string, level: number): string {
  const prefix = "    ".repeat(level);
  return text
    .split("\n")
    .map((line) => (line.trim() ? prefix + line : ""))
    .join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// PER-COMPONENT GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

function generateButtonSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Type variants
  const types = def.props["type"];
  if (types && typeof types === "object" && types.values) {
    lines.push(tag("paragraph", { name: "Visual style (type)" }));
    lines.push(tag("layout-flow", { gap: "sm", row: true },
      "\n" + types.values.map((v: string) =>
        "    " + tag("button", { type: v, name: v })
      ).join("\n") + "\n",
    ));
  }

  // Size variants
  const sizes = def.props["size"];
  if (sizes && typeof sizes === "object" && sizes.values) {
    lines.push(tag("paragraph", { name: "Size" }));
    lines.push(tag("layout-flow", { gap: "sm", row: true, "align-items": "end" },
      "\n" + sizes.values.map((v: string) =>
        "    " + tag("button", { size: v, name: v })
      ).join("\n") + "\n",
    ));
  }

  // Boolean states
  const booleanProps = getBooleanProps(def);
  if (booleanProps.length > 0) {
    lines.push(tag("paragraph", { name: "Boolean states" }));
    lines.push(tag("layout-flow", { gap: "sm", row: true },
      "\n" + booleanProps.map((p) =>
        "    " + tag("button", { [p]: true, name: p })
      ).join("\n") + "\n",
    ));
  }

  // With icon
  lines.push(tag("paragraph", { name: "With icon" }));
  lines.push(tag("layout-flow", { gap: "sm", row: true },
    "\n" +
    `    ${tag("button", { type: "primary", name: "Save", "show-icon": "before", icon: "vinkje" })}\n` +
    `    ${tag("button", { type: "secondary", name: "Search", "show-icon": "before", icon: "zoek" })}\n` +
    `    ${tag("button", { type: "warning", name: "Delete", "show-icon": "before", icon: "kruis" })}\n` +
    `    ${tag("button", { type: "tertiary", name: "Next", "show-icon": "after", icon: "delta-omlaag" })}\n`,
  ));

  return lines.join("\n");
}

function generateAlertSection(def: ComponentDefinition): string {
  const lines: string[] = [];
  const types = def.props["type"];

  if (types && typeof types === "object" && types.values) {
    lines.push(tag("paragraph", { name: "Alert types" }));
    lines.push(tag("layout-flow", { gap: "md" },
      "\n" + types.values.map((v: string) =>
        "    " + tag("alert", { type: v, heading: v.charAt(0).toUpperCase() + v.slice(1) },
          `This is ${v === "info" || v === "error" ? "an" : "a"} ${v} alert message.`,
        )
      ).join("\n") + "\n",
    ));
  }

  // Closable
  lines.push(tag("paragraph", { name: "Closable alert" }));
  lines.push(tag("alert", { type: "info", heading: "Closable", closable: true },
    "This alert can be dismissed.",
  ));

  return lines.join("\n");
}

function generateIconSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Icon samples
  lines.push(tag("paragraph", { name: "Icon samples" }));
  lines.push(tag("layout-flow", { gap: "md", row: true },
    "\n" + DEMO_ICONS.map((name) =>
      "    " + tag("icon", { icon: name, size: "lg", "aria-label": name }, undefined, true)
    ).join("\n") + "\n",
  ));

  // Size variants
  const sizes = def.props["size"];
  if (sizes && typeof sizes === "object" && sizes.values) {
    lines.push(tag("paragraph", { name: "Sizes" }));
    lines.push(tag("layout-flow", { gap: "sm", row: true, "align-items": "end" },
      "\n" + sizes.values.map((v: string) =>
        "    " + tag("icon", { icon: "info", size: v, "aria-label": `${v} icon` }, undefined, true)
      ).join("\n") + "\n",
    ));
  }

  return lines.join("\n");
}

function generateCardSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Basic cards
  lines.push(tag("paragraph", { name: "Card variants" }));
  lines.push(tag("grid", { columns: "two", gap: "md" },
    "\n" +
    `    ${tag("card", { title: "Basic Card", outline: true }, "\n        " + tag("paragraph", { name: "A simple card with outline." }) + "\n    ")}\n` +
    `    ${tag("card", { title: "Linked Card", href: "#", "show-link-indicator": true, "full-card-link": true, outline: true }, "\n        " + tag("paragraph", { name: "A clickable card with link indicator." }) + "\n    ")}\n`,
  ));

  // Layout variants
  const layouts = def.props["layout"];
  if (layouts && typeof layouts === "object" && layouts.values) {
    lines.push(tag("paragraph", { name: "Layout direction" }));
    for (const v of layouts.values) {
      lines.push(tag("card", { title: `Layout: ${v}`, layout: v, outline: true, padding: "md" },
        "\n    " + tag("paragraph", { name: `This card uses ${v} layout.` }) + "\n",
      ));
    }
  }

  // Padding variants
  const padding = def.props["padding"];
  if (padding && typeof padding === "object" && padding.values) {
    lines.push(tag("paragraph", { name: "Padding" }));
    lines.push(tag("grid", { columns: "three", gap: "sm" },
      "\n" + padding.values.map((v: string) =>
        "    " + tag("card", { title: `padding: ${v}`, padding: v, outline: true },
          tag("paragraph", { name: v }),
        )
      ).join("\n") + "\n",
    ));
  }

  // Boolean props
  lines.push(tag("paragraph", { name: "Boolean props" }));
  lines.push(tag("grid", { columns: "two", gap: "md" },
    "\n" +
    `    ${tag("card", { title: "Outline", outline: true }, tag("paragraph", { name: "Card with outline border." }))}\n` +
    `    ${tag("card", { title: "Inverted Colors", "inverted-colors": true, "background-color": "donkerblauw" }, tag("paragraph", { name: "Card with inverted colors." }))}\n`,
  ));

  return lines.join("\n");
}

function generateHeadingSection(def: ComponentDefinition): string {
  const lines: string[] = [];
  const types = def.props["type"];

  if (types && typeof types === "object" && types.values) {
    lines.push(tag("paragraph", { name: "Heading levels" }));
    for (const v of types.values) {
      lines.push(tag("heading", { type: v, name: `Heading ${v}` }));
    }
  }

  return lines.join("\n");
}

function generateParagraphSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Color variants
  const colors = def.props["color"];
  if (colors && typeof colors === "object" && colors.values) {
    lines.push(tag("heading", { type: "h3", name: "Paragraph colors" }));
    for (const v of colors.values) {
      lines.push(tag("paragraph", { color: v, name: `Color: ${v}` }));
    }
  }

  // Size variants
  const sizes = def.props["size"];
  if (sizes && typeof sizes === "object" && sizes.values) {
    lines.push(tag("heading", { type: "h3", name: "Paragraph sizes" }));
    for (const v of sizes.values) {
      lines.push(tag("paragraph", { size: v, name: `Size: ${v}` }));
    }
  }

  // Boolean: no-spacing
  lines.push(tag("heading", { type: "h3", name: "No spacing" }));
  lines.push(tag("paragraph", { "no-spacing": true, name: "This paragraph has no bottom spacing." }));
  lines.push(tag("paragraph", { name: "This follows immediately." }));

  return lines.join("\n");
}

function generateLinkSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Color variants
  const colors = def.props["color"];
  if (colors && typeof colors === "object" && colors.values) {
    lines.push(tag("heading", { type: "h3", name: "Link colors" }));
    lines.push(tag("layout-flow", { gap: "sm", row: true },
      "\n" + colors.values.map((v: string) =>
        "    " + tag("link", { href: "#", color: v, name: v })
      ).join("\n") + "\n",
    ));
  }

  // Weight variants
  const weights = def.props["weight"];
  if (weights && typeof weights === "object" && weights.values) {
    lines.push(tag("heading", { type: "h3", name: "Link weights" }));
    lines.push(tag("layout-flow", { gap: "sm", row: true },
      "\n" + weights.values.map((v: string) =>
        "    " + tag("link", { href: "#", weight: v, name: `weight: ${v}` })
      ).join("\n") + "\n",
    ));
  }

  // With icon
  lines.push(tag("heading", { type: "h3", name: "Link with icon" }));
  lines.push(tag("layout-flow", { gap: "sm", row: true },
    "\n" +
    `    ${tag("link", { href: "#", name: "Icon before", "show-icon": "before", icon: "delta-omlaag" })}\n` +
    `    ${tag("link", { href: "#", name: "Icon after", "show-icon": "after", icon: "delta-omlaag" })}\n`,
  ));

  // Boolean states
  lines.push(tag("heading", { type: "h3", name: "Link states" }));
  lines.push(tag("layout-flow", { gap: "sm", row: true },
    "\n" +
    `    ${tag("link", { href: "#", name: "hover", hover: true })}\n` +
    `    ${tag("link", { href: "#", name: "active", active: true })}\n` +
    `    ${tag("link", { href: "#", name: "focus", focus: true })}\n` +
    `    ${tag("link", { href: "#", name: "no-underline", "no-underline": true })}\n`,
  ));

  return lines.join("\n");
}

function generateLabelSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Type variants
  const types = def.props["type"];
  if (types && typeof types === "object" && types.values) {
    lines.push(tag("layout-flow", { gap: "sm" },
      "\n" + types.values.map((v: string) =>
        "    " + tag("label", { name: `Label (${v})`, type: v })
      ).join("\n") + "\n",
    ));
  }

  // Size variants
  const sizes = def.props["size"];
  if (sizes && typeof sizes === "object" && sizes.values) {
    lines.push(tag("layout-flow", { gap: "sm" },
      "\n" + sizes.values.map((v: string) =>
        "    " + tag("label", { name: `Size: ${v}`, size: v })
      ).join("\n") + "\n",
    ));
  }

  return lines.join("\n");
}

function generateMenuSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Type variants
  const types = def.props["type"];
  if (types && typeof types === "object" && types.values) {
    for (const v of types.values) {
      lines.push(tag("paragraph", { name: `Menu type: ${v}` }));
      lines.push(tag("menu", { type: v, "aria-label": `${v} menu example` },
        "\n" +
        `    ${tag("menu-item", { name: "Home", href: "#", icon: "huis", active: true })}\n` +
        `    ${tag("menu-item", { name: "Products", href: "#" })}\n` +
        `    ${tag("menu-item", { name: "About", href: "#" })}\n` +
        `    ${tag("menu-item", { name: "Contact", href: "#" })}\n`,
      ));
    }
  }

  // With disabled item
  lines.push(tag("paragraph", { name: "With disabled item" }));
  lines.push(tag("menu", { type: "horizontal", "aria-label": "Menu with disabled item" },
    "\n" +
    `    ${tag("menu-item", { name: "Enabled", href: "#" })}\n` +
    `    ${tag("menu-item", { name: "Disabled", href: "#", disabled: true })}\n`,
  ));

  return lines.join("\n");
}

function generateBreadcrumbsSection(def: ComponentDefinition): string {
  const lines: string[] = [];

  // Size variants
  const sizes = def.props["size"];
  if (sizes && typeof sizes === "object" && sizes.values) {
    for (const v of sizes.values) {
      lines.push(tag("paragraph", { name: `Size: ${v}` }));
      lines.push(tag("breadcrumbs", { size: v, "aria-label": "Breadcrumbs example" },
        "\n" +
        `    ${tag("breadcrumbs-item", { name: "Home", href: "#" })}\n` +
        `    ${tag("breadcrumbs-item", { name: "Section", href: "#" })}\n` +
        `    ${tag("breadcrumbs-item", { name: "Current Page" })}\n`,
      ));
    }
  }

  return lines.join("\n");
}

function generateDataListSection(): string {
  return tag("data-list", {},
    "\n" +
    "    <dt>Component count</dt>\n" +
    "    <dd>22</dd>\n" +
    "    <dt>Template engine</dt>\n" +
    "    <dd>Jinja2</dd>\n" +
    "    <dt>CSS framework</dt>\n" +
    "    <dd>RVO / Utrecht</dd>\n" +
    "    <dt>Generated from</dt>\n" +
    "    <dd>Component definitions</dd>\n",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERIC SECTION GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/** Get boolean prop names for a component (excluding skipped ones) */
function getBooleanProps(def: ComponentDefinition): string[] {
  return Object.entries(def.props)
    .filter(([name, spec]) => spec === null && !SKIP_PROPS.has(name))
    .map(([name]) => name);
}

/** Get enum props (with values arrays) for a component (excluding skipped ones) */
function getEnumProps(def: ComponentDefinition): [string, NonNullable<PropSpec> & { values: readonly string[] }][] {
  return Object.entries(def.props)
    .filter((entry): entry is [string, NonNullable<PropSpec> & { values: readonly string[] }] => {
      const [name, spec] = entry;
      return spec !== null && typeof spec === "object" && !!spec.values && !SKIP_PROPS.has(name);
    });
}

/** Generate a generic section for a component without a custom generator */
function generateGenericSection(def: ComponentDefinition): string {
  const lines: string[] = [];
  const tagName = def.name;
  const isContentAllowed = def.content?.allowed ?? false;
  const isSelfClosing = !isContentAllowed;

  // Enum props
  for (const [propName, spec] of getEnumProps(def)) {
    lines.push(tag("paragraph", { name: `${propName}` }));
    const items = spec.values.map((v: string) => {
      const attrs: Record<string, string | boolean> = { [propName]: v };
      // For components that use "name" for display, set it
      if ("name" in def.props) attrs.name = `${v}`;
      return "    " + tag(tagName, attrs, isContentAllowed ? v : undefined, isSelfClosing);
    });
    lines.push(tag("layout-flow", { gap: "sm", row: true },
      "\n" + items.join("\n") + "\n",
    ));
  }

  // Boolean props
  const booleans = getBooleanProps(def);
  if (booleans.length > 0) {
    lines.push(tag("paragraph", { name: "Boolean props" }));
    const items = booleans.map((p) => {
      const attrs: Record<string, string | boolean> = { [p]: true };
      if ("name" in def.props) attrs.name = p;
      return "    " + tag(tagName, attrs, isContentAllowed ? p : undefined, isSelfClosing);
    });
    lines.push(tag("layout-flow", { gap: "sm", row: true },
      "\n" + items.join("\n") + "\n",
    ));
  }

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/** Custom section generators keyed by component name */
const CUSTOM_GENERATORS: Record<string, (def: ComponentDefinition) => string> = {
  button: generateButtonSection,
  alert: generateAlertSection,
  icon: generateIconSection,
  card: generateCardSection,
  heading: generateHeadingSection,
  paragraph: generateParagraphSection,
  link: generateLinkSection,
  label: generateLabelSection,
  menu: generateMenuSection,
  breadcrumbs: generateBreadcrumbsSection,
  "data-list": generateDataListSection as unknown as (def: ComponentDefinition) => string,
};

/**
 * Generate a complete HTML showcase from component implementations.
 *
 * @param implementations - The same array used in generate-all.ts
 * @returns Complete HTML string using <c-*> tags
 */
export function generateShowcase(
  implementations: readonly ComponentImplementation[],
): string {
  // Group components by category
  const byCategory = new Map<string, ComponentDefinition[]>();
  for (const impl of implementations) {
    const def = impl.component;
    if (STRUCTURAL_COMPONENTS.has(def.name)) continue;
    if (INLINE_COMPONENTS.has(def.name)) continue;

    const category = def.category ?? "other";
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(def);
  }

  // Build body sections
  const sections: string[] = [];

  // Typography inline demo (strong, em shown inside paragraph)
  sections.push("");
  sections.push("    <!-- Typography: Inline elements -->");
  sections.push(`    ${tag("heading", { type: "h2", name: "Inline Typography" })}`);
  sections.push(`    ${tag("paragraph", {},
    "\n        This paragraph contains " +
    tag("strong", {}, "bold text") + ",\n        " +
    tag("em", {}, "italic text") + ",\n        and a " +
    tag("link", { href: "#" }, "hyperlink") + ".\n    ",
  )}`);

  // Component sections by category
  for (const [categoryKey, categoryLabel] of CATEGORY_ORDER) {
    const defs = byCategory.get(categoryKey);
    if (!defs || defs.length === 0) continue;

    sections.push("");
    sections.push(`    <!-- ${categoryLabel} -->`);

    for (const def of defs) {
      sections.push("");
      sections.push(`    ${tag("heading", { type: "h2", name: def.name.charAt(0).toUpperCase() + def.name.slice(1) })}`);
      if (def.description) {
        sections.push(`    ${tag("paragraph", { name: def.description })}`);
      }

      // Use custom generator or fall back to generic
      const generator = CUSTOM_GENERATORS[def.name];
      const content = generator ? generator(def) : generateGenericSection(def);
      if (content) {
        sections.push(indent(content, 1));
      }
    }
  }

  // Assemble full page
  const body = [
    tag("header", { text: "Lord of the Components", subtitle: "Component Showcase" }),
    "",
    tag("hero", { title: "Component Showcase", subtitle: "All components · All variants · Generated from definitions" }),
    "",
    "<c-max-width-layout size=\"lg\">",
    "<c-layout-flow gap=\"lg\">",
    sections.join("\n"),
    "",
    "</c-layout-flow>",
    "</c-max-width-layout>",
    "",
    tag("footer", { "pay-off": "Auto-generated from component definitions" }),
  ].join("\n");

  return tag("page", { title: "LOTC Component Showcase", theme: "rvo" }, "\n" + body + "\n") + "\n";
}
