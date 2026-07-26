/** NLDD Link — <nldd-link href text>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { link } from "../../../definitions/components/link.def.js";

export const linkImpl = defineImplementation({
  component: link,
  root: {
    element: "nldd-link",
    isRoot: true,
    attributes: [
      { prop: "href", attr: "href", type: "value", conditional: true },
      { prop: "target", attr: "target", type: "value", conditional: true },
      { prop: "label", attr: "text", type: "value", conditional: true },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
