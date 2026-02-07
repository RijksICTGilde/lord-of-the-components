/**
 * Footer Implementation (v2 — Element Tree API)
 *
 * Maps the footer component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: footer
 *   - Base class: rvo-footer
 *   - Inner container: rvo-footer__container with optional max-width modifier
 *   - Children content passed through
 *   - Optional payoff text section
 */

import { defineImplementation } from "../implementation.js";
import { footer } from "../../definitions/components/footer.def.js";

export const footerImpl = defineImplementation({
  component: footer,

  root: {
    element: "footer",
    isRoot: true,
    classes: ["rvo-footer"],

    children: [
      // Inner container
      {
        element: "div",
        classes: [
          "rvo-footer__container",
          { prop: "max-width", pattern: "rvo-footer__container--{value}", when: ["sm", "md", "lg"] },
        ],
        children: [
          // Children content
          {
            element: "span",
            when: { prop: "children" },
            text: "{{ children | safe }}",
          },
          // Payoff text
          {
            element: "div",
            when: { prop: "pay-off" },
            classes: ["rvo-footer__payoff"],
            text: "{{ pay_off }}",
          },
        ],
      },
    ],
  },

  mixins: {
    utilityClasses: false,
    genericAttributes: true,
  },
});
