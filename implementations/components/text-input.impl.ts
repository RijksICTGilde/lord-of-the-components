/** RVO text-input — native <input class="utrecht-textbox">. */
import { defineImplementation } from "../implementation.js";
import { textInput } from "../../definitions/components/text-input.def.js";

export const textInputImpl = defineImplementation({
  component: textInput,
  root: {
    element: "input",
    isRoot: true,
    classes: [
      "utrecht-textbox",
      "utrecht-textbox--html-input",
      { prop: "disabled", class: "utrecht-textbox--disabled" },
    ],
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
