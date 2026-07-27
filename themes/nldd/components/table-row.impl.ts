/** NLDD table body row -> <nldd-table-row>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { tableRow } from "../../../definitions/components/table-row.def.js";

export const tableRowImpl = defineImplementation({
  component: tableRow,
  root: {
    element: "nldd-table-row",
    isRoot: true,
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
