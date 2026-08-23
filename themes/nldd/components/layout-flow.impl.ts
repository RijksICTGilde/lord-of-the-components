/** NLDD Layout-flow — <nldd-container gap layout>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { layoutFlow } from "../../../definitions/components/layout-flow.def.js";

export const layoutFlowImpl = defineImplementation({
  component: layoutFlow,
  root: {
    element: "nldd-container",
    isRoot: true,
    attributes: [
      { prop: "gap", attr: "gap", type: "value", conditional: true, valueMap: "gap" },
    ],
    text: { content: true },
  },
  // The two scales do not speak the same language. `gap` on c-layout-flow is the
  // layout layer's t-shirt scale; `gap` on nldd-container is NLDD's PaddingSize
  // ('0' | '2' | ... | '96'). Passing the t-shirt size straight through produced
  // an invalid value, which the browser resolves to `normal` — no gap at all,
  // and no error: 189 calls in one application, every card with its heading
  // against its body, visible only on a screenshot (RIG-Cluster, RC-151).
  //
  // Worse, strictness pointed the wrong way: `gap="md"` passed because it is in
  // OUR enum, while `gap="16"` — the value that actually works — was rejected.
  //
  // Mapped by VALUE, from --lotc-space-* in layout.css at a 16px root: 3xs is
  // 0.125rem so 2, xs is 0.5rem so 8, md is 1rem so 16, and so on. 4xl/5xl have
  // no --lotc-space entry, so they continue the scale onto NLDD's last two
  // steps. c-card's implementation already worked this way; this one did not.
  valueMaps: {
    gap: {
      "0": "0",
      "3xs": "2",
      "2xs": "4",
      xs: "8",
      sm: "12",
      md: "16",
      lg: "24",
      xl: "32",
      "2xl": "48",
      "3xl": "64",
      "4xl": "80",
      "5xl": "96",
    },
  },
  mixins: { genericAttributes: true },
});
