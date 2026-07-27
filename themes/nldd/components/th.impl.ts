/** NLDD table header cell -> <nldd-cell> (header styling comes from the header row). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { th } from "../../../definitions/components/th.def.js";

export const thImpl = defineImplementation({
  component: th,
  root: {
    element: "nldd-cell",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
