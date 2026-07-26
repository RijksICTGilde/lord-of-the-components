/** Stylistically bold text implementation — native <b>. */
import { defineImplementation } from "../implementation.js";
import { b } from "../../definitions/components/b.def.js";

export const bImpl = defineImplementation({
  component: b,
  root: {
    element: "b",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
