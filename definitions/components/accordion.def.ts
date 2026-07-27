/** Accordion — a set of collapsible items (plan v7 F9, sweep). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const accordion = defineComponent({
  name: "accordion",
  description: "Container for <c-accordion-item> collapsible items",
  category: "data",
  props: {
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type AccordionDefinition = typeof accordion;
