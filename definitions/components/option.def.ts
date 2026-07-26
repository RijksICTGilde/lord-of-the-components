/** Option — a single choice inside a <c-select> (plan v7 F9, batch C). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const option = defineComponent({
  name: "option",
  description: "A single option for a select; label via prop or content",
  category: "forms",
  props: {
    [PROPS.VALUE]: { description: "Value submitted when this option is chosen" },
    [PROPS.LABEL]: { description: "Visible option text (content overrides)" },
    [PROPS.SELECTED]: null,
    [PROPS.DISABLED]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type OptionDefinition = typeof option;
