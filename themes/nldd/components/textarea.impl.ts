/** NLDD textarea -> <nldd-multi-line-text-field>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { textarea } from "../../../definitions/components/textarea.def.js";

export const textareaImpl = defineImplementation({
  component: textarea,
  root: {
    element: "nldd-multi-line-text-field",
    isRoot: true,
    attributes: [
      { prop: "name", attr: "name", type: "value", conditional: true },
      { prop: "value", attr: "value", type: "value", conditional: true },
      { prop: "placeholder", attr: "placeholder", type: "value", conditional: true },
      { prop: "disabled", attr: "disabled", type: "boolean" },
      { prop: "required", attr: "required", type: "boolean" },
      { prop: "readonly", attr: "readonly", type: "boolean" },
    ],
  },
  mixins: { genericAttributes: true },
});
