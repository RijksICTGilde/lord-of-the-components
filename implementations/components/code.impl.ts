/** Inline code implementation — native <code>. */
import { defineImplementation } from "../implementation.js";
import { code } from "../../definitions/components/code.def.js";

export const codeImpl = defineImplementation({
  component: code,
  root: {
    element: "code",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
