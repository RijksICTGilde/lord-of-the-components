/**
 * Layout-Row Component Definition
 *
 * Grid row container for <c-layout-column> children.
 * Provides gap and vertical spacing control.
 *
 * Usage:
 *   <c-layout-row gap="md">
 *     <c-layout-column size="md-6">Left</c-layout-column>
 *     <c-layout-column size="md-6">Right</c-layout-column>
 *   </c-layout-row>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const layoutRow = defineComponent({
  name: "layout-row",
  description: "Grid row container with gap and vertical spacing",
  category: "layout",

  props: {
    /**
     * Gap between columns
     * @default "md"
     */
    [PROPS.GAP]: {
      values: VALUES.LAYOUT_GAP_SIZES,
      default: "md",
      description: "Gap between columns",
    },

    /**
     * Vertical spacing / margin, or "center" for alignment
     * @default "lg"
     */
    [PROPS.VERTICAL_SPACING]: {
      values: VALUES.VERTICAL_SPACING,
      default: "lg",
      description: "Vertical spacing or center alignment",
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
    description: "Layout columns",
  },
});

export type LayoutRowDefinition = typeof layoutRow;
