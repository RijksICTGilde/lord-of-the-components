/**
 * Em Implementation
 *
 * Maps the em component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components em.html.j2 (CSS class source of truth)
 *
 * Key behavior:
 *   - Element: span (not <em>, following RVO pattern)
 *   - Base class: rvo-text--italic
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { em } from "../../definitions/components/em.def.js";

export const emImpl = defineImplementation({
  component: em,
  element: "span",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-text--italic",
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
