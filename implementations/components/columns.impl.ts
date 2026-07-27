/** Columns — <div class="lotc-columns"> with per-breakpoint column-count CSS vars.
 * Theme-agnostic (static/lotc/layout.css); one jinja template for both themes.
 * Set only the breakpoints that change; each falls back to the smaller one. */
import { defineImplementation } from "../implementation.js";
import { columns } from "../../definitions/components/columns.def.js";

export const columnsImpl = defineImplementation({
  component: columns,
  root: {
    element: "div",
    isRoot: true,
    classes: ["lotc-columns"],
    styles: [
      { property: "--lotc-cols", prop: "columns" },
      { property: "--lotc-cols-sm", prop: "sm" },
      { property: "--lotc-cols-md", prop: "md" },
      { property: "--lotc-cols-lg", prop: "lg" },
      { property: "--lotc-columns-gap", prop: "gap" },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});
