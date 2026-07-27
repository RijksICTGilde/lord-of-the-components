/** RVO accordion item — native <details class="rvo-accordion__item"> with a
 * summary (down/up toggle icons + title) and a content panel. */
import { defineImplementation } from "../implementation.js";
import { accordionItem } from "../../definitions/components/accordion-item.def.js";

export const accordionItemImpl = defineImplementation({
  component: accordionItem,
  root: {
    element: "details",
    isRoot: true,
    classes: ["rvo-accordion__item"],
    attributes: [{ prop: "open", attr: "open", type: "boolean" }],
    children: [
      {
        element: "summary",
        classes: ["rvo-accordion__item-summary"],
        children: [
          {
            element: "div",
            classes: ["rvo-accordion__item-icon"],
            children: [
              {
                element: "span",
                classes: [
                  "utrecht-icon", "rvo-icon", "rvo-icon-delta-omlaag",
                  "rvo-icon--md", "rvo-icon--hemelblauw", "rvo-accordion__item-icon--closed",
                ],
                attributes: [
                  { attr: "role", type: "static", value: "img" },
                  { attr: "aria-hidden", type: "static", value: "true" },
                ],
              },
              {
                element: "span",
                classes: [
                  "utrecht-icon", "rvo-icon", "rvo-icon-delta-omhoog",
                  "rvo-icon--md", "rvo-icon--hemelblauw", "rvo-accordion__item-icon--open",
                ],
                attributes: [
                  { attr: "role", type: "static", value: "img" },
                  { attr: "aria-hidden", type: "static", value: "true" },
                ],
              },
            ],
          },
          {
            element: "div",
            classes: ["rvo-accordion__item-title-container"],
            children: [
              {
                element: "h3",
                classes: ["utrecht-heading-3", "rvo-accordion__item-title"],
                text: { prop: "title" },
              },
            ],
          },
        ],
      },
      {
        element: "div",
        classes: ["rvo-accordion__content"],
        text: { content: true },
      },
    ],
  },
  mixins: { genericAttributes: true },
});
