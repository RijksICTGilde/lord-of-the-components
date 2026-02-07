/**
 * Layout-Column Implementation (v2 — Element Tree API)
 *
 * Maps the layout-column component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: div
 *   - Base class: rvo-layout-column
 *   - Size: rvo-layout-column--{size} where size is e.g. md-6, lg-4
 *   - Content: children pass-through
 */

import { defineImplementation } from "../implementation.js";
import { layoutColumn } from "../../definitions/components/layout-column.def.js";
import { VALUES } from "../../definitions/values.js";

export const layoutColumnImpl = defineImplementation({
  component: layoutColumn,

  root: {
    element: "div",
    isRoot: true,

    classes: [
      "rvo-layout-column",
      {
        prop: "size",
        pattern: "rvo-layout-column--{value}",
        when: [...VALUES.COLUMN_SIZES],
      },
    ],

    text: "{{ children | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
