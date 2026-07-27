/** NLDD tab -> <nldd-tab-bar-item> (label via the text attribute). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { tab } from "../../../definitions/components/tab.def.js";

export const tabImpl = defineImplementation({
  component: tab,
  root: {
    element: "nldd-tab-bar-item",
    isRoot: true,
    attributes: [
      { prop: "label", attr: "text", type: "value", conditional: true },
      { prop: "href", attr: "href", type: "value", conditional: true },
      { prop: "active", attr: "selected", type: "boolean" },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
