/** Radio — single option in a radio-button group (plan v7 F9, batch C). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const radio = defineComponent({
  name: "radio",
  description: "Single radio button with a label",
  category: "forms",
  props: {
    [PROPS.NAME]: { description: "HTML form field name (shared across a group)" },
    [PROPS.VALUE]: { description: "Value submitted when selected" },
    [PROPS.LABEL]: { description: "Visible label text (content overrides)" },
    [PROPS.CHECKED]: null,
    [PROPS.DISABLED]: null,
    [PROPS.REQUIRED]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: false },
});
export type RadioDefinition = typeof radio;
