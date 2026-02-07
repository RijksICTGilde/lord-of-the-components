/**
 * Strong Component Definition
 *
 * Semantic bold text wrapper rendered as a span with bold styling.
 *
 * Usage:
 *   <c-strong name="Important text"/>
 *   <c-strong>Bold content here</c-strong>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const strong = defineComponent({
  name: "strong",
  description: "Semantic bold text wrapper",
  category: "typography",

  props: {
    /**
     * Text content
     * Can be overridden by content between tags
     */
    [PROPS.NAME]: {
      description: "Text content (can be overridden by content between tags)",
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
      "Bold content (overrides name prop). Can include HTML/components.",
  },
});

export type StrongDefinition = typeof strong;
