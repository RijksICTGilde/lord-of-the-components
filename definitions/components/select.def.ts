/** Select — dropdown form control; options supplied as content (plan v7 F9, batch C). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const select = defineComponent({
  name: "select",
  description: "Dropdown select; <option> elements go in the content",
  category: "forms",
  props: {
    [PROPS.NAME]: { description: "HTML form field name" },
    [PROPS.VALUE]: { description: "Currently selected value" },
    [PROPS.PLACEHOLDER]: { description: "Placeholder / prompt text" },
    [PROPS.DISABLED]: null,
    [PROPS.REQUIRED]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type SelectDefinition = typeof select;
