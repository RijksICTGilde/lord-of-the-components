/**
 * Layout-Flow Implementation (v2 — Element Tree API)
 *
 * Maps the layout-flow component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: div
 *   - Max-width layout: rvo-max-width-layout + rvo-max-width-layout--{size}
 *   - Direction: rvo-layout-column (default) or rvo-layout-row (when row)
 *   - Gap: rvo-layout-gap--{value}
 *   - Wrap: rvo-layout--wrap
 *   - Alignment: rvo-layout-align-items-{value}, rvo-layout-align-content-{value},
 *     rvo-layout-justify-items-{value}, rvo-layout-justify-content-{value}
 *   - Content: children pass-through
 *
 * Note: Direction uses if/else via computedVars — "row" prop is truthy → rvo-layout-row,
 * otherwise rvo-layout-column. The v2 API supports NotCondition for this.
 */

import { defineImplementation } from "../implementation.js";
import { layoutFlow } from "../../definitions/components/layout-flow.def.js";

export const layoutFlowImpl = defineImplementation({
  component: layoutFlow,

  computedVars: [
    {
      name: "is_column",
      condition: { not: { prop: "row" } },
    },
  ],

  root: {
    element: "div",
    isRoot: true,

    classes: [
      "rvo-max-width-layout",
      { prop: "size", pattern: "rvo-max-width-layout--{value}", when: ["sm", "md", "lg"] },
      { prop: "row", class: "rvo-layout-row" },
      { prop: "is_column", class: "rvo-layout-column" },
      { prop: "gap", pattern: "rvo-layout-gap--{value}", when: ["0", "3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] },
      { prop: "wrap", class: "rvo-layout--wrap" },
      { prop: "align-items", pattern: "rvo-layout-align-items-{value}", when: ["start", "center", "end"] },
      { prop: "align-content", pattern: "rvo-layout-align-content-{value}", when: ["start", "center", "end", "space-between"] },
      { prop: "justify-items", pattern: "rvo-layout-justify-items-{value}", when: ["start", "center", "end"] },
      { prop: "justify-content", pattern: "rvo-layout-justify-content-{value}", when: ["start", "center", "end", "space-between"] },
    ],

    text: { content: true },
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
