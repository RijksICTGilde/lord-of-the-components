/** RVO accordion — <div class="rvo-accordion"> of <c-accordion-item> details. */
import { defineImplementation } from "../implementation.js";
import { accordion } from "../../definitions/components/accordion.def.js";

export const accordionImpl = defineImplementation({
  component: accordion,
  root: {
    element: "div",
    isRoot: true,
    classes: ["rvo-accordion"],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
