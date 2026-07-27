/** Table header cell (plan v7 F9, batch table). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const th = defineComponent({
  name: "th",
  description: "Table header cell; label via content",
  category: "data",
  props: {
    // Right-aligns for numeric columns (RVO rvo-table-header--numeric / NLDD alignment).
    ["numeric"]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type ThDefinition = typeof th;
