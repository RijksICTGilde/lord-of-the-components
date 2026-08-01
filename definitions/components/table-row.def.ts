/** Table body row (plan v7 F9, batch table). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const tableRow = defineComponent({
  name: "table-row",
  description: "Table body row; <c-td> cells go in the content",
  category: "data",
  props: {
    // Marks the row as selected (checkbox/selectable tables). Boolean: presence = true.
    [PROPS.SELECTED]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type TableRowDefinition = typeof tableRow;
