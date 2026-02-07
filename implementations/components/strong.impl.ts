/**
 * Strong Implementation
 *
 * Maps the strong component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components strong.html.j2 (CSS class source of truth)
 *
 * Key behavior:
 *   - Element: span (not <strong>, following RVO pattern)
 *   - Base class: rvo-text--bold
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { strong } from "../../definitions/components/strong.def.js";

export const strongImpl = defineImplementation({
  component: strong,
  element: "span",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-text--bold",
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
