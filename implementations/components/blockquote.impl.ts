/** Block quotation implementation — native <blockquote>. */
import { defineImplementation } from "../implementation.js";
import { blockquote } from "../../definitions/components/blockquote.def.js";

export const blockquoteImpl = defineImplementation({
  component: blockquote,
  root: {
    element: "blockquote",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
