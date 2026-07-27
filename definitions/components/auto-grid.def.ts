/** Auto-grid — responsive column grid that wraps by available width (plan v7 F9, layout). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const autoGrid = defineComponent({
  name: "auto-grid",
  description: "Responsive column grid: as many columns as fit at a minimum width, then wrap",
  category: "layout",
  system: true,
  props: {
    // Minimum column width; more columns appear as the container widens.
    [PROPS.MIN]: { description: "Minimum column width, e.g. '16rem' (CSS length)" },
    [PROPS.GAP]: { description: "Gap between cells, e.g. '1rem' (CSS length)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type AutoGridDefinition = typeof autoGrid;
