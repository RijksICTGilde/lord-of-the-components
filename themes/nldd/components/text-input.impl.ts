/** NLDD text-input -> <nldd-text-field>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { textInput } from "../../../definitions/components/text-input.def.js";

export const textInputImpl = defineImplementation({
  component: textInput,
  root: {
    element: "nldd-text-field",
    isRoot: true,
    attributes: [
      { prop: "type", attr: "type", type: "value" },
      { prop: "name", attr: "name", type: "value", conditional: true },
      { prop: "value", attr: "value", type: "value", conditional: true },
      { prop: "placeholder", attr: "placeholder", type: "value", conditional: true },
      { prop: "autocomplete", attr: "autocomplete", type: "value", conditional: true },
      { prop: "disabled", attr: "disabled", type: "boolean" },
      { prop: "required", attr: "required", type: "boolean" },
      { prop: "readonly", attr: "readonly", type: "boolean" },
    ],
  },
  mixins: { genericAttributes: true },
});
