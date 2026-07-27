/** NLDD tabs -> <nldd-tab-bar>; items are slotted <nldd-tab-bar-item>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { tabs } from "../../../definitions/components/tabs.def.js";

export const tabsImpl = defineImplementation({
  component: tabs,
  root: {
    element: "nldd-tab-bar",
    isRoot: true,
    attributes: [
      { prop: "aria-label", attr: "accessible-label", type: "value", conditional: true },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
