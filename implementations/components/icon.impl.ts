/**
 * Icon Implementation (v2 — Element Tree API)
 *
 * Maps the icon component definition to RVO/Utrecht CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: span (self-closing, no content)
 *   - Base classes: utrecht-icon, rvo-icon
 *   - Icon-specific class: rvo-icon-{icon} (pattern)
 *   - Size class: rvo-icon--{size} (pattern with specific values)
 *   - Color class: rvo-icon--{color} (pattern, when color is set)
 *   - Attributes: role="img", aria-label from prop
 */

import { defineImplementation } from "../implementation.js";
import { icon } from "../../definitions/components/icon.def.js";

export const iconImpl = defineImplementation({
  component: icon,

  root: {
    element: "span",
    isRoot: true,

    classes: [
      "utrecht-icon",
      "rvo-icon",
      { prop: "icon", pattern: "rvo-icon-{value}" },
      { prop: "size", pattern: "rvo-icon--{value}", when: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] },
      { prop: "color", pattern: "rvo-icon--{value}" },
    ],

    attributes: [
      { attr: "role", type: "static", value: "img" },
      { prop: "aria-label", attr: "aria-label", type: "value" },
    ],
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
