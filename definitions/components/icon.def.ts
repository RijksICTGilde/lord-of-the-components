/**
 * Icon Component Definition
 *
 * Decorative or informative icon rendered as a span with RVO icon classes.
 *
 * Usage:
 *   <c-icon icon="home"/>
 *   <c-icon icon="search" size="lg" color="donkerblauw" aria-label="Search"/>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const icon = defineComponent({
  name: "icon",
  description: "Decorative or informative icon",
  category: "visual",

  props: {
    /**
     * Icon name (from the RVO icon set)
     * Determines the icon-specific CSS class: rvo-icon-{icon}
     */
    [PROPS.ICON]: {
      description: "Icon name (from the RVO icon set)",
      required: true,
    },

    /**
     * Icon size
     * @default "md"
     */
    [PROPS.SIZE]: {
      values: VALUES.SIZES_EXTENDED,
      default: "md",
      description: "Icon size",
    },

    /**
     * Icon color (RVO color name)
     * When set, adds rvo-icon--{color} class
     */
    [PROPS.COLOR]: {
      description: "Icon color (RVO color name)",
    },

    /**
     * Accessible label for the icon
     * Important for informative icons (not purely decorative)
     */
    [PROPS.ARIA_LABEL]: {
      description: "Accessible label for the icon",
    },

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: false,
    description: "Icons do not accept content (self-closing).",
  },
});

export type IconDefinition = typeof icon;
