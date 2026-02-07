/**
 * Icon Implementation
 *
 * Maps the icon component definition to RVO/Utrecht CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components icon.html.j2 (CSS class source of truth)
 *   - rvo/components/icon/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: span (self-closing, no content)
 *   - Base classes: utrecht-icon, rvo-icon
 *   - Icon-specific class: rvo-icon-{icon} (pattern)
 *   - Size class: rvo-icon--{size} (pattern)
 *   - Color class: rvo-icon--{color} (pattern, when color is set)
 *   - Attributes: role="img", aria-label from prop
 */

import { defineImplementation } from "../implementation.js";
import { icon } from "../../definitions/components/icon.def.js";

export const iconImpl = defineImplementation({
  component: icon,
  element: "span",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASSES
    // ═══════════════════════════════════════════════════════════════════════
    "utrecht-icon",
    "rvo-icon",

    // ═══════════════════════════════════════════════════════════════════════
    // ICON NAME (pattern-based, any truthy value)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "icon", pattern: "rvo-icon-{value}" },

    // ═══════════════════════════════════════════════════════════════════════
    // SIZE (pattern-based)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "size", pattern: "rvo-icon--{value}", when: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] },

    // ═══════════════════════════════════════════════════════════════════════
    // COLOR (pattern-based, when color is set)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "color", pattern: "rvo-icon--{value}" },
  ],

  attributes: [
    { attr: "role", type: "static", value: "img" },
    { prop: "aria-label", attr: "aria-label", type: "value" },
  ],

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
