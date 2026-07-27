/** NLDD card -> <nldd-card> (title in the header slot, body in the default slot). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { card } from "../../../definitions/components/card.def.js";

export const cardImpl = defineImplementation({
  component: card,
  root: {
    element: "nldd-card",
    isRoot: true,
    attributes: [
      { prop: "href", attr: "href", type: "value", conditional: true },
      { prop: "target", attr: "target", type: "value", conditional: true },
    ],
    children: [
      // Title -> header slot (only when a title is given).
      {
        element: "span",
        when: { prop: "title" },
        attributes: [{ attr: "slot", type: "static", value: "header" }],
        text: { prop: "title" },
      },
      // Body -> default slot.
      { element: "div", text: { content: true } },
    ],
  },
  mixins: { genericAttributes: true },
});
