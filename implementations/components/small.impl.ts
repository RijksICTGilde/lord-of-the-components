/** Small print / de-emphasized text implementation — native <small>. */
import { defineImplementation } from "../implementation.js";
import { small } from "../../definitions/components/small.def.js";

export const smallImpl = defineImplementation({
  component: small,
  root: {
    element: "small",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
