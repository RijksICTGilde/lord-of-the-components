/**
 * Link Implementation
 *
 * Maps the link component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components link.html.j2 (CSS class source of truth)
 *   - rvo/components/link/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: a
 *   - Base class: rvo-link
 *   - State classes: rvo-link--active, rvo-link--hover, rvo-link--focus
 *   - With icon: rvo-link--with-icon (when show-icon != "no")
 *   - No underline: rvo-link--no-underline (boolean)
 *   - Color: rvo-link--{color} for non-default colors
 *   - Weight: rvo-link--normal (only for normal weight, bold is default)
 *   - Full container: rvo-link--full-card-link (boolean)
 *   - Content blocks for icon before/after with nested c-icon
 */

import { defineImplementation } from "../implementation.js";
import { link } from "../../definitions/components/link.def.js";

export const linkImpl = defineImplementation({
  component: link,
  element: "a",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-link",

    // ═══════════════════════════════════════════════════════════════════════
    // STATE CLASSES (boolean)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "active", class: "rvo-link--active" },
    { prop: "hover", class: "rvo-link--hover" },
    { prop: "focus", class: "rvo-link--focus" },

    // ═══════════════════════════════════════════════════════════════════════
    // WITH ICON (when show-icon is "before" or "after")
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "show-icon", eq: "before", class: "rvo-link--with-icon" },
    { prop: "show-icon", eq: "after", class: "rvo-link--with-icon" },

    // ═══════════════════════════════════════════════════════════════════════
    // NO UNDERLINE (boolean)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "no-underline", class: "rvo-link--no-underline" },

    // ═══════════════════════════════════════════════════════════════════════
    // COLOR (conditional, non-default colors only; hemelblauw is default)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "color", eq: "donkerblauw", class: "rvo-link--donkerblauw" },
    { prop: "color", eq: "lintblauw", class: "rvo-link--lintblauw" },
    { prop: "color", eq: "wit", class: "rvo-link--wit" },
    { prop: "color", eq: "zwart", class: "rvo-link--zwart" },
    { prop: "color", eq: "grijs-700", class: "rvo-link--grijs-700" },

    // ═══════════════════════════════════════════════════════════════════════
    // WEIGHT (only 'normal' gets a class; 'bold' is default)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "weight", eq: "normal", class: "rvo-link--normal" },

    // ═══════════════════════════════════════════════════════════════════════
    // FULL CONTAINER LINK (boolean)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "full-container-link", class: "rvo-link--full-card-link" },
  ],

  attributes: [
    { prop: "href", attr: "href", type: "value" },
    { prop: "role", attr: "role", type: "value" },
    { prop: "target", attr: "target", type: "value" },
  ],

  content: [
    {
      template:
        '<span class="utrecht-icon rvo-icon rvo-icon-{{ icon }} rvo-icon--{{ icon_size }} rvo-icon--{{ icon_color }} rvo-link__icon--before"></span>',
      when: { prop: "show-icon", eq: "before" },
    },
    {
      template: "{{ children if children else name | safe }}",
    },
    {
      template:
        '<span class="utrecht-icon rvo-icon rvo-icon-{{ icon }} rvo-icon--{{ icon_size }} rvo-icon--{{ icon_color }} rvo-link__icon--after"></span>',
      when: { prop: "show-icon", eq: "after" },
    },
  ],

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
