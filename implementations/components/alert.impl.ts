/**
 * Alert Implementation (v2 — Element Tree API)
 *
 * Maps the alert component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Outer div: rvo-alert, rvo-alert--{type}, rvo-alert--padding-{padding}
 *   - Inner container: rvo-alert__container, optional rvo-max-width-layout--{max-width}
 *   - Status icon with Dutch name mapping (info→info, warning→waarschuwing, etc.)
 *   - Alert text section with optional heading (<strong>)
 *   - Children content in a <div>
 *   - Optional close button when closable
 */

import { defineImplementation } from "../implementation.js";
import { alert } from "../../definitions/components/alert.def.js";

export const alertImpl = defineImplementation({
  component: alert,

  valueMaps: {
    "status-icon": {
      "info": "info",
      "warning": "waarschuwing",
      "error": "foutmelding",
      "success": "bevestiging",
    },
  },

  root: {
    element: "div",
    isRoot: true,

    classes: [
      "rvo-alert",
      { prop: "type", pattern: "rvo-alert--{value}", when: ["info", "success", "warning", "error"] },
      { prop: "padding", pattern: "rvo-alert--padding-{value}", when: ["xs", "sm", "md", "lg", "xl", "2xl"] },
      { prop: "max-width", class: "rvo-alert--layout" },
    ],

    children: [
      // Container div
      {
        element: "div",
        classes: [
          "rvo-alert__container",
          { prop: "max-width", pattern: "rvo-max-width-layout--{value}", when: ["sm", "md", "lg"] },
        ],
        children: [
          // Status icon
          {
            element: "span",
            classes: [
              "utrecht-icon",
              "rvo-icon",
              { prop: "type", pattern: "rvo-icon-{value}", valueMap: "status-icon" },
              "rvo-status-icon",
              { prop: "type", pattern: "rvo-status-icon-{value}", valueMap: "status-icon" },
              "rvo-icon--xl",
            ],
            attributes: [
              { attr: "role", type: "static", value: "img" },
              { prop: "type", attr: "aria-label", type: "value", valueMap: "status-icon", filter: "title" },
            ],
          },
          // Alert text section
          {
            element: "div",
            classes: ["rvo-alert-text"],
            children: [
              // Optional heading
              {
                element: "strong",
                when: { prop: "heading" },
                text: "{{ heading }}",
              },
              // Content div
              {
                element: "div",
                text: "{{ children | safe }}",
              },
            ],
          },
          // Close button (when closable)
          {
            element: "button",
            when: { prop: "closable" },
            classes: ["utrecht-button", "utrecht-button--subtle", "rvo-button__close"],
            attributes: [
              { attr: "type", type: "static", value: "button" },
              { attr: "aria-label", type: "static", value: "Sluiten" },
            ],
            children: [
              {
                element: "span",
                classes: ["utrecht-icon", "rvo-icon", "rvo-icon-kruis", "rvo-icon--md"],
                attributes: [
                  { attr: "role", type: "static", value: "img" },
                  { attr: "aria-label", type: "static", value: "Kruis" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});
