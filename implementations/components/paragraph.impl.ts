/**
 * Paragraph Implementation
 *
 * Maps the paragraph component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components paragraph.html.j2 (CSS class source of truth)
 *   - rvo/components/paragraph/src/template.tsx (React reference)
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
  element: "p",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-paragraph",

    // ═══════════════════════════════════════════════════════════════════════
    // COLOR (pattern-based)
    // ═══════════════════════════════════════════════════════════════════════
    {
      prop: "color",
      pattern: "rvo-paragraph--{value}",
      when: ["logoblauw", "wit", "zwart", "grijs-500", "grijs-900"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SIZE (pattern-based)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "size", pattern: "rvo-paragraph--{value}", when: ["sm", "md", "lg"] },

    // ═══════════════════════════════════════════════════════════════════════
    // NO SPACING (boolean)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "no-spacing", class: "rvo-paragraph--no-spacing" },
  ],

  content: [
    {
      template: "{{ children if children else name | safe }}",
    },
  ],

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
