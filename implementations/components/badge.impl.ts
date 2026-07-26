/** RVO badge — <span class="rvo-badge"> counter/notification indicator.
 * RVO's badge has a single visual style, so `type` only affects the NLDD theme. */
import { defineImplementation } from "../implementation.js";
import { badge } from "../../definitions/components/badge.def.js";

export const badgeImpl = defineImplementation({
  component: badge,
  root: {
    element: "span",
    isRoot: true,
    classes: ["rvo-badge"],
    text: { coalesce: [{ content: true }, { prop: "label" }] },
  },
  mixins: { genericAttributes: true },
});
