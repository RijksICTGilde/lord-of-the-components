/**
 * Header Implementation
 *
 * Maps the header component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components header.html.j2 (CSS class source of truth)
 *   - rvo/components/header/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: header
 *   - Base class: rvo-header
 *   - Inner structure: logo wrapper > logo link > logo (emblem SVG + wordmark text)
 *   - Props: text (org name), subtitle, link (logo href)
 *   - Children content rendered after logo wrapper
 *
 * NOTE: The generated template will be heavily hand-tuned due to the complex
 * nested structure with embedded Rijksoverheid SVG logo.
 */

import { defineImplementation } from "../implementation.js";
import { header } from "../../definitions/components/header.def.js";

export const headerImpl = defineImplementation({
  component: header,
  element: "header",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-header",
  ],

  content: [
    {
      template: "{{ children | safe }}",
    },
  ],

  mixins: {
    utilityClasses: false,
    genericAttributes: true,
  },
});
