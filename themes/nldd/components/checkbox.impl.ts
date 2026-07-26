/** NLDD checkbox -> <nldd-checkbox-field> (label attribute carries the visible text). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { checkbox } from "../../../definitions/components/checkbox.def.js";

export const checkboxImpl = defineImplementation({
  component: checkbox,
  root: {
    element: "nldd-checkbox-field",
    isRoot: true,
    attributes: [
      { prop: "name", attr: "name", type: "value", conditional: true },
      { prop: "value", attr: "value", type: "value", conditional: true },
      { prop: "label", attr: "label", type: "value", conditional: true },
      { prop: "checked", attr: "checked", type: "boolean" },
      { prop: "disabled", attr: "disabled", type: "boolean" },
    ],
  },
  mixins: { genericAttributes: true },
});
