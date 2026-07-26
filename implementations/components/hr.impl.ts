/** Thematic break implementation — native <hr>. */
import { defineImplementation } from "../implementation.js";
import { hr } from "../../definitions/components/hr.def.js";

export const hrImpl = defineImplementation({
  component: hr,
  root: {
    element: "hr",
    isRoot: true,
  },
  mixins: { genericAttributes: true },
});
