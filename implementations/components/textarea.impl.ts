/** RVO textarea — native <textarea class="utrecht-textbox">. */
import { defineImplementation } from "../implementation.js";
import { textarea } from "../../definitions/components/textarea.def.js";

export const textareaImpl = defineImplementation({
  component: textarea,
  root: {
    element: "textarea",
    isRoot: true,
    classes: [
      "utrecht-textbox",
      "utrecht-textbox--html-textarea",
      { prop: "disabled", class: "utrecht-textbox--disabled" },
    ],
    attributes: [
      { prop: "name", attr: "name", type: "value", conditional: true },
      { prop: "placeholder", attr: "placeholder", type: "value", conditional: true },
      { prop: "disabled", attr: "disabled", type: "boolean" },
      { prop: "required", attr: "required", type: "boolean" },
      { prop: "readonly", attr: "readonly", type: "boolean" },
    ],
    text: { prop: "value" },
  },
  mixins: { genericAttributes: true },
});
