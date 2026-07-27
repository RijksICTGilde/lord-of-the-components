/** RVO table body cell — <td class="rvo-table-cell">. */
import { defineImplementation } from "../implementation.js";
import { td } from "../../definitions/components/td.def.js";

export const tdImpl = defineImplementation({
  component: td,
  root: {
    element: "td",
    isRoot: true,
    classes: ["rvo-table-cell", { prop: "numeric", class: "rvo-table-cell--numeric" }],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
