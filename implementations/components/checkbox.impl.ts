/** RVO checkbox — <label class="rvo-checkbox"> wrapping a native checkbox input. */
import { defineImplementation } from "../implementation.js";
import { checkbox } from "../../definitions/components/checkbox.def.js";

export const checkboxImpl = defineImplementation({
  component: checkbox,
  root: {
    element: "label",
    isRoot: true,
    classes: ["rvo-checkbox", { prop: "disabled", class: "rvo-checkbox--disabled" }],
    children: [
      {
        element: "input",
        classes: ["rvo-checkbox__input"],
        attributes: [
          { attr: "type", type: "static", value: "checkbox" },
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
