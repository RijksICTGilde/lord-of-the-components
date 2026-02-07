/**
 * Label Component Definition
 *
 * Form field label with size and type variants.
 *
 * Usage:
 *   <c-label for="email" name="Email address"/>
 *   <c-label for="name" type="required">Full name</c-label>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const label = defineComponent({
  name: "label",
  description: "Form field label with size and type variants",
  category: "typography",

  props: {
    /**
     * Label text content
     * Can be overridden by content between tags
     */
    [PROPS.NAME]: {
      description: "Label text (can be overridden by content between tags)",
    },

    /**
     * ID attribute for the label element
     */
    [PROPS.ID]: {
      description: "HTML id attribute",
    },

    /**
     * Associates the label with a form control
     */
    [PROPS.HTML_FOR]: {
      description: "Associates label with a form control (for attribute)",
    },

    /**
     * Label size
     * @default "md"
     */
    [PROPS.SIZE]: {
      values: VALUES.LABEL_SIZES,
      default: "md",
      description: "Label size",
    },

    /**
     * Label type (default, optional, required)
     * @default "default"
     */
    [PROPS.TYPE]: {
      values: VALUES.LABEL_TYPES,
      default: "default",
      description: "Label type (default, optional, required)",
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
      "Label content (overrides name prop). Can include HTML/components.",
  },
});

export type LabelDefinition = typeof label;
