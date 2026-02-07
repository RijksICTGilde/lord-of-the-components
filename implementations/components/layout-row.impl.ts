/**
 * Layout-Row Implementation
 *
 * Maps the layout-row component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components layout-row.html.j2 (CSS class source of truth)
 *
 * Key behavior:
 *   - Element: div
 *   - Base class: rvo-layout-row
 *   - Gap: rvo-layout-gap--{value}
 *   - Vertical spacing: rvo-layout-vertical--{value} or rvo-layout-align-content-center
 *   - Content: children pass-through (layout-column children)
 */

import { defineImplementation } from "../implementation.js";
import { layoutRow } from "../../definitions/components/layout-row.def.js";

export const layoutRowImpl = defineImplementation({
  component: layoutRow,
  element: "div",

  classes: [
    "rvo-layout-row",

    // Gap between columns
    {
      prop: "gap",
      pattern: "rvo-layout-gap--{value}",
      when: ["0", "3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
    },

    // Vertical spacing: size values map to rvo-layout-vertical--{value}
    {
      prop: "vertical-spacing",
      pattern: "rvo-layout-vertical--{value}",
      when: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
    },

    // Vertical spacing: "center" maps to a different class
    {
      prop: "vertical-spacing",
      eq: "center",
      class: "rvo-layout-align-content-center",
    },
  ],

  attributes: [],

  content: "{{ children | safe }}",

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
