/** RVO tab — <li class="rvo-tabs__item"><a class="rvo-tabs__item-link">. */
import { defineImplementation } from "../implementation.js";
import { tab } from "../../definitions/components/tab.def.js";

export const tabImpl = defineImplementation({
  component: tab,
  root: {
    element: "li",
    isRoot: true,
    classes: ["rvo-tabs__item"],
    children: [
      {
        element: "a",
        classes: [
          "rvo-tabs__item-link",
          { prop: "active", class: "rvo-tabs__item-link--active" },
        ],
        attributes: [{ prop: "href", attr: "href", type: "value", conditional: true }],
        text: { coalesce: [{ content: true }, { prop: "label" }] },
      },
    ],
  },
  mixins: { genericAttributes: true },
});
