/** NLDD radio -> <nldd-radio-button-field> (label attribute carries the visible text). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { radio } from "../../../definitions/components/radio.def.js";

export const radioImpl = defineImplementation({
  component: radio,
  root: {
    element: "nldd-radio-button-field",
    isRoot: true,
    attributes: [
      { prop: "name", attr: "name", type: "value", conditional: true },
      { prop: "value", attr: "value", type: "value", conditional: true },
      { prop: "label", attr: "label", type: "value", conditional: true },
      { prop: "checked", attr: "checked", type: "boolean" },
      { prop: "disabled", attr: "disabled", type: "boolean" },
      { prop: "required", attr: "required", type: "boolean" },
    ],
  },
  mixins: { genericAttributes: true },
});
