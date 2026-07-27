/** Table — data table root; rows go in the content (plan v7 F9, batch table). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const table = defineComponent({
  name: "table",
  description: "Data table; <c-table-head> and <c-table-row> go in the content",
  category: "data",
  props: {
    // NLDD grid track template, e.g. "1fr 1fr auto"; ignored by RVO (native table).
    [PROPS.COLUMNS]: { description: "NLDD column track template, e.g. '1fr 1fr auto'" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type TableDefinition = typeof table;
