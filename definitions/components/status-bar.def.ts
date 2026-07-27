/** Status bar — a full-width, single-line bar for persistent system state. */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const statusBar = defineComponent({
  name: "status-bar",
  description: "Full-width single-line bar for persistent system state (e.g. a demo notice, outage)",
  category: "feedback",
  props: {
    [PROPS.TYPE]: {
      values: ["neutral", "info", "success", "warning", "error"],
      default: "neutral",
      description: "Semantic status (maps to the design system's variant)",
    },
    text: { description: "Status text (single line, truncated with ellipsis)" },
    [PROPS.HREF]: { description: "Makes the whole bar a link" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});
export type StatusBarDefinition = typeof statusBar;
