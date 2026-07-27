/** NLDD status bar -> <nldd-status-bar>. Semantic `type` maps to StatusBarVariant. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { statusBar } from "../../../definitions/components/status-bar.def.js";

export const statusBarImpl = defineImplementation({
  component: statusBar,
  root: {
    element: "nldd-status-bar",
    isRoot: true,
    attributes: [
      { prop: "type", attr: "variant", type: "value", conditional: true, valueMap: "variant" },
      { prop: "text", attr: "text", type: "value", conditional: true },
      { prop: "href", attr: "href", type: "value", conditional: true },
    ],
  },
  valueMaps: {
    // LOTC status type -> NLDD StatusBarVariant (neutral|accent|success|warning|critical).
    variant: {
      neutral: "neutral",
      info: "accent",
      success: "success",
      warning: "warning",
      error: "critical",
    },
  },
  mixins: { genericAttributes: true },
});
