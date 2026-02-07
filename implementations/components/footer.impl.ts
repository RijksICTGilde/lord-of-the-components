/**
 * Footer Implementation
 *
 * Maps the footer component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components footer.html.j2 (CSS class source of truth)
 *   - rvo/components/footer/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: footer
 *   - Base class: rvo-footer
 *   - Inner container: rvo-footer__container with optional max-width modifier
 *   - Payoff text section
 *   - Children content passed through for menu structure
 *
 * NOTE: The generated template will be hand-tuned due to the nested container
 * structure and conditional payoff section.
 */

import { defineImplementation } from "../implementation.js";
import { footer } from "../../definitions/components/footer.def.js";

export const footerImpl = defineImplementation({
  component: footer,
  element: "footer",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-footer",
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
