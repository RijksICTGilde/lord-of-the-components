/** Generic block container implementation — native <div>. */
import { defineImplementation } from "../implementation.js";
import { div } from "../../definitions/components/div.def.js";

export const divImpl = defineImplementation({
  component: div,
  root: {
    element: "div",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
