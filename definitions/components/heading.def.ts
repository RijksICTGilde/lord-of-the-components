/**
 * Heading Component Definition
 *
 * Semantic heading element with dynamic level (h1-h6).
 *
 * Usage:
 *   <c-heading type="h1" name="Page Title"/>
 *   <c-heading type="h2">Section Title</c-heading>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const heading = defineComponent({
  name: "heading",
  description: "Semantic heading element with dynamic level",
  category: "typography",

  props: {
    /**
     * Heading level (h1-h6), determines the HTML element tag
     * @default "h1"
     */
    [PROPS.TYPE]: {
      values: VALUES.HEADING_LEVELS,
      default: "h1",
      description: "Heading level (h1-h6)",
    },

    /**
     * Visual size, decoupled from the semantic level. When omitted it follows
     * `type` (h1→largest). Set it to render, say, a semantic h1 at a smaller
     * visual scale (as NLDD's nldd-title separates level from size).
     */
    [PROPS.SIZE]: {
      values: ["1", "2", "3", "4", "5", "6"],
      description: "Visual size (1-6), independent of the heading level",
    },

    /**
     * Heading text content
     * Can be overridden by content between tags
     */
    [PROPS.LABEL]: {
      description: "Heading text (can be overridden by content between tags)",
    },

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description:
      "Heading content (overrides name prop). Can include HTML/components.",
  },
});

export type HeadingDefinition = typeof heading;
