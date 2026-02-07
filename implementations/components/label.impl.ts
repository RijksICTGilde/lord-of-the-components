/**
 * Label Implementation
 *
 * Maps the label component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components label.html.j2 (CSS class source of truth)
 *   - rvo/components/form-field-label/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: label
 *   - Base class: rvo-label
 *   - Size: rvo-label--sm (only sm gets a class; md is default)
 *   - Type: rvo-label--optional, rvo-label--required (default gets no class)
 *   - Attributes: id, for (HTML for attribute)
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { label } from "../../definitions/components/label.def.js";

export const labelImpl = defineImplementation({
  component: label,
  element: "label",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-label",

    // ═══════════════════════════════════════════════════════════════════════
    // SIZE (only sm gets a modifier; md is default)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "size", eq: "sm", class: "rvo-label--sm" },

    // ═══════════════════════════════════════════════════════════════════════
    // TYPE (optional and required get modifiers; default gets none)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "type", eq: "optional", class: "rvo-label--optional" },
    { prop: "type", eq: "required", class: "rvo-label--required" },
  ],

  attributes: [
    { prop: "id", attr: "id", type: "value" },
    { prop: "for", attr: "for", type: "value" },
  ],

  content: [
    {
      template: "{{ children if children else name | safe }}",
    },
  ],

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
