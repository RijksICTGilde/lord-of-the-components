/** NLDD block quotation -> <nldd-blockquote>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { blockquote } from "../../../definitions/components/blockquote.def.js";

export const blockquoteImpl = defineImplementation({
  component: blockquote,
  root: {
    element: "nldd-blockquote",
    isRoot: true,
    text: { content: true },
    attributes: [{ prop: "cite", attr: "cite", type: "value", conditional: true }],
  },
  mixins: { genericAttributes: true },
});
