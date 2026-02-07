/**
 * Max-Width-Layout Implementation (v2 — Element Tree API)
 *
 * Maps the max-width-layout component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: div
 *   - Base class: rvo-max-width-layout
 *   - Size: rvo-max-width-layout--{sm|md|lg}
 *   - Inline padding: rvo-max-width-layout-inline-padding--{none|sm|md|lg}
 *   - Uncentered: rvo-max-width-layout--uncentered (when uncentered prop is set)
 *   - Content: children pass-through
 */

import { defineImplementation } from "../implementation.js";
import { maxWidthLayout } from "../../definitions/components/max-width-layout.def.js";

export const maxWidthLayoutImpl = defineImplementation({
  component: maxWidthLayout,

  root: {
    element: "div",
    isRoot: true,

    classes: [
      "rvo-max-width-layout",
      { prop: "size", pattern: "rvo-max-width-layout--{value}", when: ["sm", "md", "lg"] },
      { prop: "inline-padding", pattern: "rvo-max-width-layout-inline-padding--{value}", when: ["none", "sm", "md", "lg"] },
      { prop: "uncentered", class: "rvo-max-width-layout--uncentered" },
    ],

    text: "{{ children | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
