/** Table header row — holds the column headers (plan v7 F9, batch table). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const tableHead = defineComponent({
  name: "table-head",
  description: "Table header row; <c-th> cells go in the content",
  category: "data",
  props: {
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type TableHeadDefinition = typeof tableHead;
