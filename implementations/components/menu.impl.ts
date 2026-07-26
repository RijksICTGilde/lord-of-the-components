/**
 * Menu Implementation (v2 — Element Tree API)
 *
 * Maps the menu component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Outer element: div (rvo-menubar__background wrapper)
 *   - Inner nav: rvo-menubar rvo-menubar--{size}
 *   - Nested list structure: ul.rvo-menubar__ul > li.rvo-menubar__list > ul.rvo-menubar__group--flex
 *   - Vertical direction adds --vertical modifiers to list and group classes
 *   - Content pass-through for declarative <c-menu-item> children
 */

import { defineImplementation } from "../implementation.js";
import { menu } from "../../definitions/components/menu.def.js";

export const menuImpl = defineImplementation({
  component: menu,

  root: {
    element: "div",
    isRoot: true,
    classes: ["rvo-menubar__background"],

    children: [
      // Navigation element
      {
        element: "nav",
        classes: [
          "rvo-menubar",
          { prop: "size", pattern: "rvo-menubar--{value}" },
        ],
        attributes: [
          { prop: "aria-label", attr: "aria-label", type: "value", conditional: true },
        ],
        children: [
          // Outer ul
          {
            element: "ul",
            classes: ["rvo-menubar__ul"],
            children: [
              // List item
              {
                element: "li",
                classes: [
                  "rvo-menubar__list",
                  { prop: "type", eq: "vertical", class: "rvo-menubar__list--vertical" },
                ],
                children: [
                  // Group flex ul — renders :items data (repeat) plus any
                  // declarative <c-menu-item> children.
                  {
                    element: "ul",
                    classes: [
                      "rvo-menubar__group--flex",
                      { prop: "type", eq: "vertical", class: "rvo-menubar__group--vertical" },
                    ],
                    children: [
                      {
                        repeat: { binding: "items", as: "item" },
                        children: [
                          {
                            element: "li",
                            classes: [
                              "rvo-menubar__item",
                              { prop: "item.active", class: "rvo-menubar__item--active" },
                            ],
                            children: [
                              {
                                element: "a",
                                when: { prop: "item.href" },
                                classes: ["rvo-link", "rvo-menubar__link"],
                                attributes: [
                                  { prop: "item.href", attr: "href", type: "value" },
                                ],
                                text: { prop: "item.label" },
                              },
                              {
                                element: "span",
                                when: { not: { prop: "item.href" } },
                                classes: ["rvo-link", "rvo-menubar__link"],
                                text: { prop: "item.label" },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                    text: { content: true },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  mixins: {
    utilityClasses: false,
    genericAttributes: true,
  },
});
