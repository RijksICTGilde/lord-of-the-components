/**
 * NLDD Heading — <nldd-title size="N"><hN>...</hN></nldd-title>.
 * nldd-title slots a real h1..h6; its size attr is the numeric level.
 */
import { defineImplementation } from "../../../implementations/implementation.js";
import { heading } from "../../../definitions/components/heading.def.js";

export const headingImpl = defineImplementation({
  component: heading,
  root: {
    element: "nldd-title",
    isRoot: true,
    attributes: [
      // Explicit visual size wins; otherwise derive it from the heading level.
      { prop: "size", attr: "size", type: "value", conditional: true },
      {
        prop: "type",
        attr: "size",
        type: "value",
        valueMap: "size",
        when: { not: { prop: "size" } },
      },
    ],
    children: [
      {
        element: { prop: "type", default: "h1" },
        text: { coalesce: [{ content: true }, { prop: "label" }] },
      },
    ],
  },
  valueMaps: { size: { h1: "1", h2: "2", h3: "3", h4: "4", h5: "5", h6: "6" } },
  mixins: { genericAttributes: true },
});
