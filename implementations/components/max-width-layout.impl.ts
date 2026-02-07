/**
 * Max-Width-Layout Implementation
 *
 * Maps the max-width-layout component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components max-width-layout.html.j2 (CSS class source of truth)
 *   - rvo/components/max-width-layout/src/template.tsx (React reference)
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
  element: "div",

  classes: [
    "rvo-max-width-layout",

    // Size variants
    {
      prop: "size",
      pattern: "rvo-max-width-layout--{value}",
      when: ["sm", "md", "lg"],
    },

    // Inline padding
    {
      prop: "inline-padding",
      pattern: "rvo-max-width-layout-inline-padding--{value}",
      when: ["none", "sm", "md", "lg"],
    },

    // Uncentered: when the uncentered boolean prop is present
    { prop: "uncentered", class: "rvo-max-width-layout--uncentered" },
  ],

  attributes: [],

  content: "{{ children | safe }}",

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
