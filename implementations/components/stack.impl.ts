/** Stack — <div class="lotc-stack"> with a uniform, theme-agnostic direction.
 * Structural flexbox (static/lotc/layout.css); one jinja template for both themes
 * (see specs/layout.md). direction=horizontal is the only class that flips the
 * axis, so the direction is enforced the same way regardless of theme. */
import { defineImplementation } from "../implementation.js";
import { stack } from "../../definitions/components/stack.def.js";

export const stackImpl = defineImplementation({
  component: stack,
  root: {
    element: "div",
    isRoot: true,
    classes: [
      "lotc-stack",
      { prop: "direction", eq: "horizontal", class: "lotc-stack--horizontal" },
      { prop: "wrap", class: "lotc-stack--wrap" },
      { prop: "align", pattern: "lotc-stack--align-{value}", when: ["start", "center", "end", "stretch"] },
      { prop: "justify", pattern: "lotc-stack--justify-{value}", when: ["start", "center", "end", "between"] },
    ],
    styles: [{ property: "--lotc-stack-gap", prop: "gap" }],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
