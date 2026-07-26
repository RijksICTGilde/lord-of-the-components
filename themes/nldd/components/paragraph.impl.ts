/** NLDD Paragraph — native <p> (NLDD has no paragraph component; prose is native). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { paragraph } from "../../../definitions/components/paragraph.def.js";

export const paragraphImpl = defineImplementation({
  component: paragraph,
  root: {
    element: "p",
    isRoot: true,
    text: { coalesce: [{ content: true }, { prop: "label" }] },
  },
  mixins: { genericAttributes: true },
});
