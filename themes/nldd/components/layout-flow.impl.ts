/** NLDD Layout-flow — <nldd-container gap layout>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { layoutFlow } from "../../../definitions/components/layout-flow.def.js";

export const layoutFlowImpl = defineImplementation({
  component: layoutFlow,
  root: {
    element: "nldd-container",
    isRoot: true,
    attributes: [
      { prop: "gap", attr: "gap", type: "value", conditional: true },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
