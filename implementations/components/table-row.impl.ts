/** RVO table body row — <tr class="rvo-table-row">. */
import { defineImplementation } from "../implementation.js";
import { tableRow } from "../../definitions/components/table-row.def.js";

export const tableRowImpl = defineImplementation({
  component: tableRow,
  root: {
    element: "tr",
    isRoot: true,
    classes: ["rvo-table-row"],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
