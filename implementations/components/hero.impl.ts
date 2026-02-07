/**
 * Hero Implementation
 *
 * Maps the hero component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components hero.html.j2 (CSS class source of truth)
 *   - rvo/components/hero/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: section
 *   - Base class: rvo-hero
 *   - Size: rvo-hero--{size} (sm, md, lg)
 *   - Image: rvo-hero--with-image when image prop set
 *   - Overlay: rvo-hero--overlay boolean
 *   - Nested structure: optional image container + content (title, subtitle, text)
 *
 * NOTE: The generated template will be hand-tuned due to the nested structure
 * with conditional image container and content sections.
 */

import { defineImplementation } from "../implementation.js";
import { hero } from "../../definitions/components/hero.def.js";

export const heroImpl = defineImplementation({
  component: hero,
  element: "section",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-hero",

    // ═══════════════════════════════════════════════════════════════════════
    // SIZE (pattern-based)
    // ═══════════════════════════════════════════════════════════════════════
    {
      prop: "size",
      pattern: "rvo-hero--{value}",
      when: ["sm", "md", "lg"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WITH-IMAGE (conditional on image prop)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "image", class: "rvo-hero--with-image" },

    // ═══════════════════════════════════════════════════════════════════════
    // OVERLAY (boolean)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "overlay", class: "rvo-hero--overlay" },
  ],

  content: [
    {
      template: "{{ children | safe }}",
    },
  ],

  mixins: {
    utilityClasses: false,
    genericAttributes: true,
  },
});
