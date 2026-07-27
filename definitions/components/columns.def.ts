/** Columns — explicit responsive column grid with per-breakpoint counts. */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const columns = defineComponent({
  name: "columns",
  description:
    "Grid with an explicit column count and a mobile-first per-breakpoint fallback " +
    "(cols = base; sm/md/lg override upward)",
  category: "layout",
  system: true,
  props: {
    // Base (mobile) column count. sm/md/lg override at wider breakpoints and
    // fall back through the smaller ones when unset.
    [PROPS.COLUMNS]: { description: "Base column count (mobile-first)" },
    ["sm"]: { description: "Column count from 40rem" },
    ["md"]: { description: "Column count from 48rem" },
    ["lg"]: { description: "Column count from 64rem" },
    [PROPS.GAP]: { description: "Gap between cells, e.g. '1rem' (CSS length)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type ColumnsDefinition = typeof columns;
