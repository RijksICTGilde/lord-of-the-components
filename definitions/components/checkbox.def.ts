/** Checkbox — single boolean form control (plan v7 F9, batch C). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const checkbox = defineComponent({
  name: "checkbox",
  description: "Single checkbox with a label",
  category: "forms",
  props: {
    [PROPS.NAME]: { description: "HTML form field name" },
    [PROPS.VALUE]: { description: "Value submitted when checked" },
    [PROPS.LABEL]: { description: "Visible label text (content overrides)" },
    [PROPS.CHECKED]: null,
    [PROPS.DISABLED]: null,
    [PROPS.REQUIRED]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: false },
});
export type CheckboxDefinition = typeof checkbox;
