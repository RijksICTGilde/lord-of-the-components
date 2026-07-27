/** Accordion item — one collapsible <details> panel (plan v7 F9, sweep). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const accordionItem = defineComponent({
  name: "accordion-item",
  description: "A collapsible item; title via prop, panel body via content",
  category: "data",
  props: {
    [PROPS.TITLE]: { description: "Summary title" },
    [PROPS.OPEN]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type AccordionItemDefinition = typeof accordionItem;
