/** RVO table — native <table class="rvo-table"> inside a responsive wrapper. */
import { defineImplementation } from "../implementation.js";
import { table } from "../../definitions/components/table.def.js";

export const tableImpl = defineImplementation({
  component: table,
  root: {
    element: "div",
    isRoot: true,
    classes: ["rvo-table--responsive"],
    children: [
      { element: "table", classes: ["rvo-table"], text: { content: true } },
    ],
  },
  mixins: { genericAttributes: true },
});
