/**
 * Alert Implementation
 *
 * Maps the alert component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components alert.html.j2 (CSS class source of truth)
 *   - rvo/components/alert/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: div (outer wrapper)
 *   - Outer classes: rvo-alert, rvo-alert--{type}, rvo-alert--padding-{padding}
 *   - Inner container: rvo-alert__container, conditional rvo-max-width-layout--{max-width}
 *   - Status icon with Dutch name mapping
 *   - Alert text section with optional heading
 *   - Optional close button when closable
 *
 * NOTE: The generated template will be heavily hand-tuned due to the complex
 * nested structure (outer div > container div > icon + text + close button).
 */

import { defineImplementation } from "../implementation.js";
import { alert } from "../../definitions/components/alert.def.js";

export const alertImpl = defineImplementation({
  component: alert,
  element: "div",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-alert",

    // ═══════════════════════════════════════════════════════════════════════
    // TYPE (pattern-based)
    // ═══════════════════════════════════════════════════════════════════════
    {
      prop: "type",
      pattern: "rvo-alert--{value}",
      when: ["info", "success", "warning", "error"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PADDING (pattern-based)
    // ═══════════════════════════════════════════════════════════════════════
    {
      prop: "padding",
      pattern: "rvo-alert--padding-{value}",
      when: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MAX-WIDTH LAYOUT FLAG
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "max-width", class: "rvo-alert--layout" },
  ],

  content: [
    {
      template: "{{ children | safe }}",
    },
  ],

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
