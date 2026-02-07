/**
 * Link Component Definition
 *
 * Styled anchor link with optional icon support.
 *
 * Usage:
 *   <c-link href="/page" name="Go to page"/>
 *   <c-link href="/home" show-icon="before" icon="home">Home page</c-link>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";
import { EVENTS } from "../events.js";

export const link = defineComponent({
  name: "link",
  description: "Styled anchor link with optional icon",
  category: "typography",

  props: {
    /**
     * Link text content
     * Can be overridden by content between tags
     */
    [PROPS.NAME]: {
      description: "Link text (can be overridden by content between tags)",
    },

    /**
     * Link URL
     */
    [PROPS.HREF]: {
      description: "Link URL",
    },

    /**
     * Link color
     * @default "hemelblauw"
     */
    [PROPS.COLOR]: {
      values: VALUES.LINK_COLORS,
      default: "hemelblauw",
      description: "Link color",
    },

    /**
     * Font weight
     * @default "bold"
     */
    [PROPS.WEIGHT]: {
      values: VALUES.LINK_WEIGHTS,
      default: "bold",
      description: "Font weight",
    },

    /**
     * Show icon position (before, after, or no)
     * @default "no"
     */
    [PROPS.SHOW_ICON]: {
      values: VALUES.ICON_POSITIONS,
      default: "no",
      description: "Icon position (before, after, or no)",
    },

    /**
     * Icon name (from the RVO icon set)
     */
    [PROPS.ICON]: {
      description: "Icon name (from the RVO icon set)",
    },

    /**
     * Icon size
     * @default "md"
     */
    [PROPS.ICON_SIZE]: {
      values: VALUES.LABEL_SIZES,
      default: "md",
      description: "Icon size",
    },

    /**
     * Icon color
     */
    [PROPS.ICON_COLOR]: {
      description: "Icon color (RVO color name)",
    },

    /**
     * Icon aria label
     */
    [PROPS.ICON_ARIA_LABEL]: {
      description: "Accessible label for the icon",
    },

    /**
     * Link target
     */
    [PROPS.TARGET]: {
      values: VALUES.LINK_TARGETS,
      description: "Link target",
    },

    /**
     * ARIA role
     */
    [PROPS.ROLE]: {
      description: "ARIA role attribute",
    },

    /**
     * Show hover state
     */
    [PROPS.HOVER]: null,

    /**
     * Show active state
     */
    [PROPS.ACTIVE]: null,

    /**
     * Show focus state
     */
    [PROPS.FOCUS]: null,

    /**
     * Remove underline
     */
    [PROPS.NO_UNDERLINE]: null,

    /**
     * Full container link (fills parent container)
     */
    [PROPS.FULL_CONTAINER_LINK]: null,

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  events: [EVENTS.CLICK],

  content: {
    allowed: true,
    description:
      "Link content (overrides name prop). Can include HTML/components.",
  },
});

export type LinkDefinition = typeof link;
