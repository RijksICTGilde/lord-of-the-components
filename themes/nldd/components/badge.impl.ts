/** NLDD badge -> <nldd-badge>. The semantic `type` maps to NLDD's Color union. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { badge } from "../../../definitions/components/badge.def.js";

export const badgeImpl = defineImplementation({
  component: badge,
  root: {
    element: "nldd-badge",
    isRoot: true,
    attributes: [
      { prop: "type", attr: "color", type: "value", conditional: true, valueMap: "color" },
      { prop: "label", attr: "text", type: "value", conditional: true },
    ],
    text: { content: true },
  },
  valueMaps: {
    // LOTC semantic status -> NLDD Color union (badge.ts).
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
