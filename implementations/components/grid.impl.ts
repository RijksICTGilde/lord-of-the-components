/**
 * Grid Implementation
 *
 * Maps the grid component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components grid.html.j2 (CSS class source of truth)
 *   - rvo/components/grid/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Two nested divs: outer rvo-layout-grid-container + inner rvo-layout-grid
 *   - Columns: rvo-layout-grid-columns--{name} (word-based: one, two, ..., twelve)
 *   - Gap: rvo-layout-gap--{value}
 *   - Division: rvo-layout-grid--division class + style="--division: {value}"
 *   - Content: children pass-through
 *
 * NOTE: Generated template will be hand-tuned to add the outer container div.
 * The generator produces a single-element template; the grid needs a wrapper.
 */

import { defineImplementation } from "../implementation.js";
import { grid } from "../../definitions/components/grid.def.js";
import { VALUES } from "../../definitions/values.js";

export const gridImpl = defineImplementation({
  component: grid,
  element: "div",

  classes: [
    // Inner grid div base class
    "rvo-layout-grid",

    // Gap between items
    {
      prop: "gap",
      pattern: "rvo-layout-gap--{value}",
      when: [...VALUES.LAYOUT_GAP_SIZES],
    },

    // Column count (word-based names)
    {
      prop: "columns",
      pattern: "rvo-layout-grid-columns--{value}",
      when: [...VALUES.GRID_COLUMN_NAMES],
    },

    // Division override adds a special class
    {
      prop: "division",
      class: "rvo-layout-grid--division",
    },
  ],

  attributes: [],

  content: "{{ children | safe }}",

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
