/**
 * Layout-Flow Component Definition
 *
 * Flexbox layout container with gap, direction, and alignment control.
 * Wraps children in a centered max-width layout with flow-based spacing.
 *
 * Usage:
 *   <c-layout-flow gap="lg">Content here</c-layout-flow>
 *   <c-layout-flow row wrap gap="md" align-items="center">
 *     <c-button name="A"/> <c-button name="B"/>
 *   </c-layout-flow>
 *   <c-layout-flow size="sm" gap="xl" justify-content="space-between">
 *     Items with space between
 *   </c-layout-flow>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const layoutFlow = defineComponent({
  name: "layout-flow",
  description: "Flexbox layout container with gap, direction, and alignment",
  category: "layout",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // SPACING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Gap between flex items
     * @default "md"
     */
    [PROPS.GAP]: {
      values: VALUES.LAYOUT_GAP_SIZES,
      default: "md",
      description: "Gap between flex items",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MAX-WIDTH LAYOUT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Max-width layout size (centered container)
     * When set to a value (sm, md, lg), the layout is wrapped in a centered max-width container.
     * When not set, no max-width layout is applied.
     * @default "lg"
     */
    [PROPS.SIZE]: {
      values: VALUES.LAYOUT_SIZES,
      default: "lg",
      description: "Max-width layout size (sm, md, lg)",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DIRECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Whether to use row (horizontal) direction instead of column (vertical)
     */
    [PROPS.ROW]: null, // boolean

    /**
     * Whether flex items should wrap
     */
    [PROPS.WRAP]: null, // boolean

    // ═══════════════════════════════════════════════════════════════════════
    // ALIGNMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Flex align-items value
     */
    [PROPS.ALIGN_ITEMS]: {
      values: VALUES.FLEX_ALIGN,
      description: "Flex align-items value",
    },

    /**
     * Flex align-content value
     */
    [PROPS.ALIGN_CONTENT]: {
      values: VALUES.FLEX_JUSTIFY,
      description: "Flex align-content value",
    },

    /**
     * Flex justify-items value
     */
    [PROPS.JUSTIFY_ITEMS]: {
      values: VALUES.FLEX_ALIGN,
      description: "Flex justify-items value",
    },

    /**
     * Flex justify-content value
     */
    [PROPS.JUSTIFY_CONTENT]: {
      values: VALUES.FLEX_JUSTIFY,
      description: "Flex justify-content value",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STYLING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description: "Layout children",
  },
});

export type LayoutFlowDefinition = typeof layoutFlow;
