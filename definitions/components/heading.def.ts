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
     * Heading text content
     * Can be overridden by content between tags
     */
    [PROPS.NAME]: {
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
