/**
 * Em Component Definition
 *
 * Semantic emphasized (italic) text wrapper rendered as a span with italic styling.
 *
 * Usage:
 *   <c-em name="Emphasized text"/>
 *   <c-em>Italic content here</c-em>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const em = defineComponent({
  name: "em",
  description: "Semantic emphasized (italic) text wrapper",
  category: "typography",

  props: {
    /**
     * Text content
     * Can be overridden by content between tags
     */
    [PROPS.LABEL]: {
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
      "Emphasized content (overrides name prop). Can include HTML/components.",
  },
});

export type EmDefinition = typeof em;
