/** RVO table header cell — <th class="rvo-table-header">. */
import { defineImplementation } from "../implementation.js";
import { th } from "../../definitions/components/th.def.js";

export const thImpl = defineImplementation({
  component: th,
  root: {
    element: "th",
    isRoot: true,
    classes: ["rvo-table-header", { prop: "numeric", class: "rvo-table-header--numeric" }],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
