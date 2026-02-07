/**
 * Menu Implementation
 *
 * Maps the menu component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components menubar.html.j2 (CSS class source of truth)
 *   - rvo/components/menubar (React reference)
 *
 * Key behavior:
 *   - Outer element: div (rvo-menubar__background wrapper)
 *   - Inner nav: rvo-menubar rvo-menubar--{size}
 *   - Nested list structure: ul > li > ul.rvo-menubar__group--flex > li.rvo-menubar__item
 *   - Items rendered as links (a.rvo-link.rvo-menubar__link) or dropdown buttons
 *   - Vertical direction adds --vertical modifiers to list/group classes
 *   - Content pass-through for declarative <c-menu-item> children
 *
 * NOTE: The generated template will be heavily hand-tuned due to the complex
 * nested structure (background > nav > ul > li > group > items).
 */

import { defineImplementation } from "../implementation.js";
import { menu } from "../../definitions/components/menu.def.js";

export const menuImpl = defineImplementation({
  component: menu,
  element: "div",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS (background wrapper)
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-menubar__background",
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
