/**
 * Grid Implementation (v2 — Element Tree API)
 *
 * Maps the grid component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Two nested divs: outer rvo-layout-grid-container + inner rvo-layout-grid
 *   - Columns: rvo-layout-grid-columns--{name} (word-based: one, two, ..., twelve)
 *   - Gap: rvo-layout-gap--{value}
 *   - Division: rvo-layout-grid--division class + style="--division: {value}"
 *   - Custom class applies to outer container
 *   - data-lotc-component on inner grid div (isRoot)
 *   - Content: children pass-through
 */

import { defineImplementation } from "../implementation.js";
import { grid } from "../../definitions/components/grid.def.js";
import { VALUES } from "../../definitions/values.js";

export const gridImpl = defineImplementation({
  component: grid,

  root: {
    element: "div",
    classes: [
      "rvo-layout-grid-container",
    ],

    children: [
      // Inner grid div (is the "root" for data-lotc-component tracking)
      {
        element: "div",
        isRoot: true,

        classes: [
          "rvo-layout-grid",
          { prop: "gap", pattern: "rvo-layout-gap--{value}", when: [...VALUES.LAYOUT_GAP_SIZES] },
          { prop: "columns", pattern: "rvo-layout-grid-columns--{value}", when: [...VALUES.GRID_COLUMN_NAMES] },
          { prop: "division", class: "rvo-layout-grid--division" },
        ],

        styles: [
          { property: "--division", prop: "division" },
        ],

        text: "{{ children | safe }}",
      },
    ],
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
