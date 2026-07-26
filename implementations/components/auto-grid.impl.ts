/** Auto-grid — <div class="lotc-auto-grid"> with tunable CSS custom properties.
 * Theme-agnostic structural layout (see static/lotc/layout.css); one jinja
 * template serves both RVO and NLDD. */
import { defineImplementation } from "../implementation.js";
import { autoGrid } from "../../definitions/components/auto-grid.def.js";

export const autoGridImpl = defineImplementation({
  component: autoGrid,
  root: {
    element: "div",
    isRoot: true,
    classes: ["lotc-auto-grid"],
    styles: [
      { property: "--lotc-col-min", prop: "min" },
      { property: "--lotc-grid-gap", prop: "gap" },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
