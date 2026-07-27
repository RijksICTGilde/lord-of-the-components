/** RVO table header row — <tr class="rvo-table-row"> of <th> cells. */
import { defineImplementation } from "../implementation.js";
import { tableHead } from "../../definitions/components/table-head.def.js";

export const tableHeadImpl = defineImplementation({
  component: tableHead,
  root: {
    element: "tr",
    isRoot: true,
    classes: ["rvo-table-row"],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
