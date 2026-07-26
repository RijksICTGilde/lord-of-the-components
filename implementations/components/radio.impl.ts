/** RVO radio — <label class="rvo-radio-button__label"> wrapping a native radio input. */
import { defineImplementation } from "../implementation.js";
import { radio } from "../../definitions/components/radio.def.js";

export const radioImpl = defineImplementation({
  component: radio,
  root: {
    element: "label",
    isRoot: true,
    classes: ["rvo-radio-button__label"],
    children: [
      {
        element: "input",
        classes: ["rvo-radio-button"],
        attributes: [
          { attr: "type", type: "static", value: "radio" },
          { prop: "name", attr: "name", type: "value", conditional: true },
          { prop: "value", attr: "value", type: "value", conditional: true },
          { prop: "checked", attr: "checked", type: "boolean" },
          { prop: "disabled", attr: "disabled", type: "boolean" },
          { prop: "required", attr: "required", type: "boolean" },
        ],
      },
      { element: "span", text: { prop: "label" } },
    ],
  },
  mixins: { genericAttributes: true },
});
