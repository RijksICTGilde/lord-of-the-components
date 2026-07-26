/**
 * Button Implementation (v2 — Element Tree API)
 *
 * Maps the button component definition to RVO/Utrecht CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Reference:
 *   - jinja-roos-components button.html.j2 (CSS class source of truth)
 *   - rvo/components/button/src/template.tsx (React reference)
 *
 * Prop name mapping (LOTC kebab-case → jinja-roos camelCase):
 *   type → kind, name → label, show-icon → showIcon,
 *   full-width → fullWidth, loading → busy, html-type → type
 */

import { defineImplementation } from "../implementation.js";
import { button } from "../../definitions/components/button.def.js";

export const buttonImpl = defineImplementation({
  component: button,

  root: {
    element: "button",
    isRoot: true,

    classes: [
      // ═══════════════════════════════════════════════════════════════════════
      // BASE CLASS
      // ═══════════════════════════════════════════════════════════════════════
      "utrecht-button",

      // ═══════════════════════════════════════════════════════════════════════
      // TYPE VARIANT CLASSES
      // ═══════════════════════════════════════════════════════════════════════

      // Primary and warning both get primary-action
      { prop: "type", eq: "primary", class: "utrecht-button--primary-action" },
      { prop: "type", eq: "warning", class: "utrecht-button--primary-action" },

      // Secondary
      { prop: "type", eq: "secondary", class: "utrecht-button--secondary-action" },

      // Tertiary (RVO-specific)
      { prop: "type", eq: "tertiary", class: "utrecht-button--rvo-tertiary-action" },

      // Quaternary (RVO-specific)
      { prop: "type", eq: "quaternary", class: "utrecht-button--rvo-quaternary-action" },

      // Subtle and warning-subtle both get subtle
      { prop: "type", eq: ["subtle", "warning-subtle"], class: "utrecht-button--subtle" },

      // Warning and warning-subtle both get warning hint
      { prop: "type", eq: ["warning", "warning-subtle"], class: "utrecht-button--warning" },

      // ═══════════════════════════════════════════════════════════════════════
      // STATE CLASSES
      // ═══════════════════════════════════════════════════════════════════════
      { prop: "active", class: "utrecht-button--active" },
      { prop: "loading", class: "utrecht-button--busy" },

      // ═══════════════════════════════════════════════════════════════════════
      // SIZE (pattern-based)
      // ═══════════════════════════════════════════════════════════════════════
      { prop: "size", pattern: "utrecht-button--rvo-{value}", when: ["xs", "sm", "md"] },

      // ═══════════════════════════════════════════════════════════════════════
      // LAYOUT
      // ═══════════════════════════════════════════════════════════════════════
      { prop: "full-width", class: "utrecht-button--rvo-full-width" },

      // ═══════════════════════════════════════════════════════════════════════
      // ICON POSITION
      // ═══════════════════════════════════════════════════════════════════════
      { prop: "show-icon", eq: "before", class: "utrecht-button--icon-before" },
      { prop: "show-icon", eq: "after", class: "utrecht-button--icon-after" },
    ],

    attributes: [
      { prop: "disabled", attr: "disabled", type: "boolean" },
      { prop: "html-type", attr: "type", type: "value" },
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
          { prop: "size", pattern: "rvo-icon--{value}" },
          { prop: "color", pattern: "rvo-icon--{value}" },
        ],
        attributes: [
          { attr: "role", type: "static", value: "img" },
          { prop: "aria-label", attr: "aria-label", type: "value" },
        ],
      },
      // Label text (children override name prop)
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
          { prop: "size", pattern: "rvo-icon--{value}" },
          { prop: "color", pattern: "rvo-icon--{value}" },
        ],
        attributes: [
          { attr: "role", type: "static", value: "img" },
          { prop: "aria-label", attr: "aria-label", type: "value" },
        ],
      },
    ],
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
