/**
 * Max-Width-Layout Component Definition
 *
 * Centered container with max-width constraints and optional inline padding.
 *
 * Usage:
 *   <c-max-width-layout size="md">Centered content</c-max-width-layout>
 *   <c-max-width-layout size="lg" inline-padding="md">Padded content</c-max-width-layout>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const maxWidthLayout = defineComponent({
  name: "max-width-layout",
  description: "Centered container with max-width constraints",
  category: "layout",

  props: {
    /**
     * Maximum width size
     * @default "md"
     */
    [PROPS.SIZE]: {
      values: VALUES.LAYOUT_SIZES,
      default: "md",
      description: "Maximum width size (sm, md, lg)",
    },

    /**
     * Horizontal padding inside the container
     * @default "none"
     */
    [PROPS.INLINE_PADDING]: {
      values: VALUES.INLINE_PADDING,
      default: "none",
      description: "Inline (horizontal) padding",
    },

    /**
     * When present, disables centering of the container
     */
    [PROPS.UNCENTERED]: null, // boolean

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description: "Container content",
  },
});

export type MaxWidthLayoutDefinition = typeof maxWidthLayout;
