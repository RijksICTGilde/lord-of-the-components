/** RVO option — native <option>. */
import { defineImplementation } from "../implementation.js";
import { option } from "../../definitions/components/option.def.js";

export const optionImpl = defineImplementation({
  component: option,
  root: {
    element: "option",
    isRoot: true,
    attributes: [
      { prop: "value", attr: "value", type: "value", conditional: true },
      { prop: "selected", attr: "selected", type: "boolean" },
      { prop: "disabled", attr: "disabled", type: "boolean" },
    ],
    text: { coalesce: [{ content: true }, { prop: "label" }] },
  },
  mixins: { genericAttributes: true },
});
