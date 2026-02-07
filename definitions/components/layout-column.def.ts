/**
 * Layout-Column Component Definition
 *
 * Grid column component for use inside <c-layout-row>.
 * Provides responsive column sizing using a 12-column grid system.
 *
 * Usage:
 *   <c-layout-column size="md-6">Half width on medium screens</c-layout-column>
 *   <c-layout-column size="lg-4">Third width on large screens</c-layout-column>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const layoutColumn = defineComponent({
  name: "layout-column",
  description: "Grid column with responsive sizing (12-column grid)",
  category: "layout",

  props: {
    /**
     * Column size: responsive breakpoint + column count (e.g., md-6, lg-4)
     */
    [PROPS.SIZE]: {
      values: VALUES.COLUMN_SIZES,
      description: "Responsive column size (e.g., md-6, lg-4, xs-12)",
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
    description: "Column content",
  },
});

export type LayoutColumnDefinition = typeof layoutColumn;
