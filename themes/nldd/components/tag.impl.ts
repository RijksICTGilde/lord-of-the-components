/** NLDD tag -> <nldd-tag>. The semantic `type` maps to NLDD's Color union. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { tag } from "../../../definitions/components/tag.def.js";

export const tagImpl = defineImplementation({
  component: tag,
  root: {
    element: "nldd-tag",
    isRoot: true,
    attributes: [
      { prop: "type", attr: "color", type: "value", conditional: true, valueMap: "color" },
      { prop: "label", attr: "text", type: "value", conditional: true },
    ],
    text: { content: true },
  },
  valueMaps: {
    // LOTC semantic status -> NLDD Color union (tag.ts).
    color: {
      default: "neutral",
      info: "accent",
      success: "success",
      warning: "warning",
      error: "critical",
    },
  },
  mixins: { genericAttributes: true },
});
