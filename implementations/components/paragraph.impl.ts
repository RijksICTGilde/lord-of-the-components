/**
 * Paragraph Implementation (v2 — Element Tree API)
 *
 * Maps the paragraph component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: p
 *   - Base class: rvo-paragraph
 *   - Color class: rvo-paragraph--{color} (pattern)
 *   - Size class: rvo-paragraph--{size} (pattern)
 *   - No-spacing: rvo-paragraph--no-spacing (boolean)
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { paragraph } from "../../definitions/components/paragraph.def.js";

export const paragraphImpl = defineImplementation({
  component: paragraph,

  root: {
    element: "p",
    isRoot: true,

    classes: [
      "rvo-paragraph",
      { prop: "color", pattern: "rvo-paragraph--{value}", when: ["logoblauw", "wit", "zwart", "grijs-500", "grijs-900"] },
      { prop: "size", pattern: "rvo-paragraph--{value}", when: ["sm", "md", "lg"] },
      { prop: "no-spacing", class: "rvo-paragraph--no-spacing" },
    ],

    text: "{{ children if children else name | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
