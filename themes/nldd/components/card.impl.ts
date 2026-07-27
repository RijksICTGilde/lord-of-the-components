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
      // Body -> default slot, wrapped in an nldd-container for padding.
      // nldd-card itself has NO intrinsic padding (.card__main is a bare slot);
      // NLDD composes padding via nldd-container (its `padding` takes a numeric
      // spacer token). Map our t-shirt `padding` prop onto that scale so
      // <c-card> content isn't flush against the card edge.
      {
        element: "nldd-container",
        attributes: [
          { prop: "padding", attr: "padding", type: "value", conditional: true, valueMap: "padding" },
        ],
        text: { content: true },
      },
    ],
  },
  valueMaps: {
    padding: { none: "0", sm: "16", md: "20", lg: "24", xl: "32" },
  },
  mixins: { genericAttributes: true },
});
