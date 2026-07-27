/** NLDD alert -> <nldd-banner>. The semantic `type` maps to NLDD's BannerVariant. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { alert } from "../../../definitions/components/alert.def.js";

export const alertImpl = defineImplementation({
  component: alert,
  root: {
    element: "nldd-banner",
    isRoot: true,
    attributes: [
      { prop: "type", attr: "variant", type: "value", conditional: true, valueMap: "variant" },
      { prop: "heading", attr: "text", type: "value", conditional: true },
      { prop: "closable", attr: "dismissible", type: "boolean" },
    ],
    text: { content: true },
  },
  valueMaps: {
    // LOTC alert type -> NLDD BannerVariant (banner.ts: neutral|accent|success|warning|critical).
    variant: {
      info: "accent",
      success: "success",
      warning: "warning",
      error: "critical",
    },
  },
  mixins: { genericAttributes: true },
});
