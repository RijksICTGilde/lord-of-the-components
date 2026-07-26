/** Generic inline container implementation — native <span>. */
import { defineImplementation } from "../implementation.js";
import { span } from "../../definitions/components/span.def.js";

export const spanImpl = defineImplementation({
  component: span,
  root: {
    element: "span",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
