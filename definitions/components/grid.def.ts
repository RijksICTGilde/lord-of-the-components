/**
 * Grid Component Definition
 *
 * Auto-fill grid layout component. Distributes children into equal-width columns
 * with responsive breakpoints. For asymmetric layouts, use layout-row/layout-column.
 *
 * Usage:
 *   <c-grid columns="three" gap="lg">
 *     <c-card title="One">...</c-card>
 *     <c-card title="Two">...</c-card>
 *     <c-card title="Three">...</c-card>
 *   </c-grid>
 *
 *   <c-grid columns="two" division="2fr 1fr">
 *     <div>Wide</div>
 *     <div>Narrow</div>
 *   </c-grid>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const grid = defineComponent({
  name: "grid",
  description: "Auto-fill grid layout with equal-width columns",
  category: "layout",

  props: {
    /**
     * Number of columns (word name)
     * @default "one"
     */
    [PROPS.COLUMNS]: {
      values: VALUES.GRID_COLUMN_NAMES,
      default: "one",
      description: "Number of grid columns (one through twelve)",
    },

    /**
     * Gap between grid items
     * @default "md"
     */
    [PROPS.GAP]: {
      values: VALUES.LAYOUT_GAP_SIZES,
      default: "md",
      description: "Gap between grid items",
    },

    /**
     * Custom CSS grid-template-columns value (e.g., "2fr 1fr")
     * Overrides responsive column behavior.
     */
    min: {
      description: "Min column width for an intrinsic auto-fit grid (lotc-layout), e.g. '16rem'",
    },

    [PROPS.DIVISION]: {
      description: "Custom grid-template-columns value (e.g., '2fr 1fr')",
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
    description: "Grid items (children)",
  },
});

export type GridDefinition = typeof grid;
