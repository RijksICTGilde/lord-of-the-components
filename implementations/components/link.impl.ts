/**
 * Link Implementation (v2 — Element Tree API)
 *
 * Maps the link component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: a
 *   - Base class: rvo-link
 *   - State classes: rvo-link--active, rvo-link--hover, rvo-link--focus
 *   - With icon: rvo-link--with-icon (when show-icon is "before" or "after")
 *   - No underline: rvo-link--no-underline (boolean)
 *   - Color: rvo-link--{color} for non-default colors (hemelblauw is default)
 *   - Weight: rvo-link--normal (only for normal weight, bold is default)
 *   - Full container: rvo-link--full-card-link (boolean)
 *   - Icon before/after: inline span with icon classes
 *   - href/role/target: conditional attributes (only rendered when truthy)
 */

import { defineImplementation } from "../implementation.js";
import { link } from "../../definitions/components/link.def.js";

export const linkImpl = defineImplementation({
  component: link,

  root: {
    element: "a",
    isRoot: true,

    classes: [
      "rvo-link",
      { prop: "active", class: "rvo-link--active" },
      { prop: "hover", class: "rvo-link--hover" },
      { prop: "focus", class: "rvo-link--focus" },
      { prop: "show-icon", eq: "before", class: "rvo-link--with-icon" },
      { prop: "show-icon", eq: "after", class: "rvo-link--with-icon" },
      { prop: "no-underline", class: "rvo-link--no-underline" },
      { prop: "color", eq: "donkerblauw", class: "rvo-link--donkerblauw" },
      { prop: "color", eq: "lintblauw", class: "rvo-link--lintblauw" },
      { prop: "color", eq: "wit", class: "rvo-link--wit" },
      { prop: "color", eq: "zwart", class: "rvo-link--zwart" },
      { prop: "color", eq: "grijs-700", class: "rvo-link--grijs-700" },
      { prop: "weight", eq: "normal", class: "rvo-link--normal" },
      { prop: "full-container-link", class: "rvo-link--full-card-link" },
    ],

    attributes: [
      { prop: "href", attr: "href", type: "value", conditional: true },
      { prop: "role", attr: "role", type: "value", conditional: true },
      { prop: "target", attr: "target", type: "value", conditional: true },
    ],

    children: [
      // Icon before label
      {
        element: "span",
        when: { prop: "show-icon", eq: "before" },
        classes: [
          "utrecht-icon",
          "rvo-icon",
          { prop: "icon", pattern: "rvo-icon-{value}" },
          { prop: "icon-size", pattern: "rvo-icon--{value}" },
          { prop: "icon-color", pattern: "rvo-icon--{value}" },
          "rvo-link__icon--before",
        ],
      },
      // Label text (children override name prop) — no wrapper element, inline text
      {
        element: "span",
        text: "{{ children if children else label | safe }}",
      },
      // Icon after label
      {
        element: "span",
        when: { prop: "show-icon", eq: "after" },
        classes: [
          "utrecht-icon",
          "rvo-icon",
          { prop: "icon", pattern: "rvo-icon-{value}" },
          { prop: "icon-size", pattern: "rvo-icon--{value}" },
          { prop: "icon-color", pattern: "rvo-icon--{value}" },
          "rvo-link__icon--after",
        ],
      },
    ],
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
