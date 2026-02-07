/**
 * Label Implementation (v2 — Element Tree API)
 *
 * Maps the label component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: label
 *   - Base class: rvo-label
 *   - Size: rvo-label--sm (only sm gets a class; md is default)
 *   - Type: rvo-label--optional, rvo-label--required (default gets no class)
 *   - Attributes: id (conditional), for (conditional — Jinja2 reserved word)
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { label } from "../../definitions/components/label.def.js";

export const labelImpl = defineImplementation({
  component: label,

  root: {
    element: "label",
    isRoot: true,

    classes: [
      "rvo-label",
      { prop: "size", eq: "sm", class: "rvo-label--sm" },
      { prop: "type", eq: "optional", class: "rvo-label--optional" },
      { prop: "type", eq: "required", class: "rvo-label--required" },
    ],

    attributes: [
      { prop: "id", attr: "id", type: "value", conditional: true },
      { prop: "for", attr: "for", type: "value", conditional: true },
    ],

    text: "{{ children if children else name | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
