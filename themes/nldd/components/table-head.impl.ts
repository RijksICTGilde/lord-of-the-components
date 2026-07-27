/** NLDD table header row -> <nldd-table-row slot="header">. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { tableHead } from "../../../definitions/components/table-head.def.js";

export const tableHeadImpl = defineImplementation({
  component: tableHead,
  root: {
    element: "nldd-table-row",
    isRoot: true,
    attributes: [{ attr: "slot", type: "static", value: "header" }],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
