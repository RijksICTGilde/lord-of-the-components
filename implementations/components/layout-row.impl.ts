/**
 * Layout-Row Implementation (v2 — Element Tree API)
 *
 * Maps the layout-row component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
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

  root: {
    element: "div",
    isRoot: true,

    classes: [
      "rvo-layout-row",
      {
        prop: "gap",
        pattern: "rvo-layout-gap--{value}",
        when: ["0", "3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
      },
      {
        prop: "vertical-spacing",
        pattern: "rvo-layout-vertical--{value}",
        when: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
      },
      {
        prop: "vertical-spacing",
        eq: "center",
        class: "rvo-layout-align-content-center",
      },
    ],

    text: "{{ children | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
