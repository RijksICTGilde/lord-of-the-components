/** NLDD option -> <nldd-menu-item> (label via the `text` attribute or slot). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { option } from "../../../definitions/components/option.def.js";

export const optionImpl = defineImplementation({
  component: option,
  root: {
    element: "nldd-menu-item",
    isRoot: true,
    attributes: [
      { prop: "value", attr: "value", type: "value", conditional: true },
      { prop: "label", attr: "text", type: "value", conditional: true },
      { prop: "selected", attr: "selected", type: "boolean" },
      { prop: "disabled", attr: "disabled", type: "boolean" },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
