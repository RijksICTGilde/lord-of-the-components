/**
 * Footer Component Definition
 *
 * Page footer with configurable max-width container and payoff text.
 * Menu content is passed as children (the complex primaryMenu/secondaryMenu
 * array structures from jinja-roos are not directly representable as HTML
 * attributes, so the footer relies on children content for its body).
 *
 * Usage:
 *   <c-footer>Footer content here</c-footer>
 *   <c-footer max-width="md" pay-off="© 2024 My Org">Menu links</c-footer>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const footer = defineComponent({
  name: "footer",
  description: "Page footer with max-width container and optional payoff",
  category: "layout",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // LAYOUT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Max-width constraint for the footer container
     */
    [PROPS.MAX_WIDTH]: {
      values: VALUES.LAYOUT_SIZES,
      description: "Max-width of the footer container (sm, md, lg)",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Payoff text displayed at the bottom of the footer
     */
    "pay-off": {
      description: "Payoff text displayed at the bottom of the footer",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STYLING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description: "Footer content (menu columns, links, etc.)",
  },
});

export type FooterDefinition = typeof footer;
