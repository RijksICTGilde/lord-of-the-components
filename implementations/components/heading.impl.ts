/**
 * Heading Implementation
 *
 * Maps the heading component definition to Utrecht CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components heading.html.j2 (CSS class source of truth)
 *   - rvo/components/heading/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Dynamic element: type prop determines HTML tag (h1-h6)
 *   - CSS class: utrecht-heading-{level} where level = type without "h" prefix
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { heading } from "../../definitions/components/heading.def.js";

export const headingImpl = defineImplementation({
  component: heading,
  element: { prop: "type", default: "h1" },

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // HEADING LEVEL CLASSES
    // Map h1→utrecht-heading-1, h2→utrecht-heading-2, etc.
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "type", eq: "h1", class: "utrecht-heading-1" },
    { prop: "type", eq: "h2", class: "utrecht-heading-2" },
    { prop: "type", eq: "h3", class: "utrecht-heading-3" },
    { prop: "type", eq: "h4", class: "utrecht-heading-4" },
    { prop: "type", eq: "h5", class: "utrecht-heading-5" },
    { prop: "type", eq: "h6", class: "utrecht-heading-6" },
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
