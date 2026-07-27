/** NLDD accordion — no NLDD accordion web component exists, so fall back to a
 * plain container of native <details> items (see accordion-item). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { accordion } from "../../../definitions/components/accordion.def.js";

export const accordionImpl = defineImplementation({
  component: accordion,
  root: {
    element: "div",
    isRoot: true,
    classes: ["nldd-accordion"],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
