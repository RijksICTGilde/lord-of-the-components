/**
 * Heading Implementation (v2 — Element Tree API)
 *
 * Maps the heading component definition to Utrecht CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Dynamic element: type prop determines HTML tag (h1-h6)
 *   - CSS class: utrecht-heading-{level} where level = type without "h" prefix
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { heading } from "../../definitions/components/heading.def.js";

export const headingImpl = defineImplementation({
  component: heading,

  root: {
    element: { prop: "type", default: "h1" },
    isRoot: true,

    classes: [
      { prop: "type", eq: "h1", class: "utrecht-heading-1" },
      { prop: "type", eq: "h2", class: "utrecht-heading-2" },
      { prop: "type", eq: "h3", class: "utrecht-heading-3" },
      { prop: "type", eq: "h4", class: "utrecht-heading-4" },
      { prop: "type", eq: "h5", class: "utrecht-heading-5" },
      { prop: "type", eq: "h6", class: "utrecht-heading-6" },
    ],

    text: "{{ children if children else name | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
