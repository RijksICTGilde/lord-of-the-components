/** NLDD table body cell -> <nldd-cell>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { td } from "../../../definitions/components/td.def.js";

export const tdImpl = defineImplementation({
  component: td,
  root: {
    element: "nldd-cell",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
