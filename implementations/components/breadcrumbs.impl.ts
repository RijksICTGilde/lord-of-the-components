/**
 * Breadcrumbs Implementation (v2 — Element Tree API)
 *
 * Maps the breadcrumbs component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: ol (ordered list)
 *   - Base class: rvo-breadcrumbs
 *   - Size variant: rvo-breadcrumbs--{size}
 *   - Content: children passed through (c-breadcrumbs-item tags)
 */

import { defineImplementation } from "../implementation.js";
import { breadcrumbs } from "../../definitions/components/breadcrumbs.def.js";

export const breadcrumbsImpl = defineImplementation({
  component: breadcrumbs,

  root: {
    element: "ol",
    isRoot: true,
    classes: [
      "rvo-breadcrumbs",
      { prop: "size", pattern: "rvo-breadcrumbs--{value}" },
    ],
    attributes: [
      { prop: "aria-label", attr: "aria-label", type: "value", conditional: true },
    ],
    text: "{{ children | safe }}",
  },

  mixins: {
    utilityClasses: false,
    genericAttributes: true,
  },
});
