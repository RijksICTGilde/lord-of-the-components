/** Text input — single-line form field (plan v7 F9, batch B). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const textInput = defineComponent({
  name: "text-input",
  description: "Single-line text input",
  category: "forms",
  props: {
    [PROPS.TYPE]: { values: VALUES.INPUT_TYPES, default: "text", description: "HTML input type" },
    [PROPS.NAME]: { description: "HTML form field name" },
    [PROPS.VALUE]: { description: "Current value" },
    [PROPS.PLACEHOLDER]: { description: "Placeholder text" },
    [PROPS.AUTOCOMPLETE]: { description: "autocomplete attribute" },
    [PROPS.DISABLED]: null,
    [PROPS.REQUIRED]: null,
    [PROPS.READONLY]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: false },
});
export type TextInputDefinition = typeof textInput;
