/**
 * Paragraph Component Definition
 *
 * Text paragraph with optional color, size, and spacing control.
 *
 * Usage:
 *   <c-paragraph name="Some text content"/>
 *   <c-paragraph color="grijs-900" size="lg">Rich content here</c-paragraph>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const paragraph = defineComponent({
  name: "paragraph",
  description: "Text paragraph with color, size, and spacing options",
  category: "typography",

  props: {
    /**
     * Paragraph text content
     * Can be overridden by content between tags
     */
    [PROPS.NAME]: {
      description: "Paragraph text (can be overridden by content between tags)",
    },

    /**
     * Text color
     * @default "grijs-900"
     */
    [PROPS.COLOR]: {
      values: VALUES.PARAGRAPH_COLORS,
      default: "grijs-900",
      description: "Text color",
    },

    /**
     * Text size
     * @default "md"
     */
    [PROPS.SIZE]: {
      values: VALUES.PARAGRAPH_SIZES,
      default: "md",
      description: "Text size",
    },

    /**
     * Remove bottom spacing
     */
    [PROPS.NO_SPACING]: null,

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
      "Paragraph content (overrides name prop). Can include HTML/components.",
  },
});

export type ParagraphDefinition = typeof paragraph;
