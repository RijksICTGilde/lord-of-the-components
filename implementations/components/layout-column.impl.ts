/**
 * Layout-Column Implementation
 *
 * Maps the layout-column component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components layout-column.html.j2 (CSS class source of truth)
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
  element: "div",

  classes: [
    "rvo-layout-column",
    {
      prop: "size",
      pattern: "rvo-layout-column--{value}",
      when: [...VALUES.COLUMN_SIZES],
    },
  ],

  attributes: [],

  content: "{{ children | safe }}",

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
