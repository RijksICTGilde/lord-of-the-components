/** Stylistically italic text implementation — native <i>. */
import { defineImplementation } from "../implementation.js";
import { i } from "../../definitions/components/i.def.js";

export const iImpl = defineImplementation({
  component: i,
  root: {
    element: "i",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
