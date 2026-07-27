/** NLDD table -> <nldd-table columns="...">; rows are slotted content. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { table } from "../../../definitions/components/table.def.js";

export const tableImpl = defineImplementation({
  component: table,
  root: {
    element: "nldd-table",
    isRoot: true,
    attributes: [{ prop: "columns", attr: "columns", type: "value", conditional: true }],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
