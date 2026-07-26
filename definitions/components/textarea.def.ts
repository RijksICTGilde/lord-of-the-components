/** Textarea — multi-line form field (plan v7 F9, batch B). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const textarea = defineComponent({
  name: "textarea",
  description: "Multi-line text input",
  category: "forms",
  props: {
    [PROPS.NAME]: { description: "HTML form field name" },
    [PROPS.VALUE]: { description: "Current value" },
    [PROPS.PLACEHOLDER]: { description: "Placeholder text" },
    [PROPS.DISABLED]: null,
    [PROPS.REQUIRED]: null,
    [PROPS.READONLY]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: false },
});
export type TextareaDefinition = typeof textarea;
