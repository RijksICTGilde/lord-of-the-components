/** NLDD accordion item — native <details>/<summary> (NLDD has no accordion). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { accordionItem } from "../../../definitions/components/accordion-item.def.js";

export const accordionItemImpl = defineImplementation({
  component: accordionItem,
  root: {
    element: "details",
    isRoot: true,
    classes: ["nldd-accordion__item"],
    attributes: [{ prop: "open", attr: "open", type: "boolean" }],
    children: [
      {
        element: "summary",
        classes: ["nldd-accordion__summary"],
        text: { prop: "title" },
      },
      {
        element: "div",
        classes: ["nldd-accordion__content"],
        text: { content: true },
      },
    ],
  },
  mixins: { genericAttributes: true },
});
