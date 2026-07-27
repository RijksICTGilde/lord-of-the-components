/** Table body cell (plan v7 F9, batch table). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const td = defineComponent({
  name: "td",
  description: "Table body cell; value via content",
  category: "data",
  props: {
    ["numeric"]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type TdDefinition = typeof td;
