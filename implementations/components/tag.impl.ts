/** RVO tag — <div class="rvo-tag rvo-tag--{type}">. */
import { defineImplementation } from "../implementation.js";
import { tag } from "../../definitions/components/tag.def.js";

export const tagImpl = defineImplementation({
  component: tag,
  root: {
    element: "div",
    isRoot: true,
    classes: ["rvo-tag", { prop: "type", pattern: "rvo-tag--{value}" }],
    text: { coalesce: [{ content: true }, { prop: "label" }] },
  },
  mixins: { genericAttributes: true },
});
