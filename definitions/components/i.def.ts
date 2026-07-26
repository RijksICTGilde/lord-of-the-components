/** Stylistically italic text — basic HTML element (plan v7 F9, batch D). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const i = defineComponent({
  name: "i",
  description: "Stylistically italic text",
  category: "html",

  props: {
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },

  content: { allowed: true, description: "Inner content." },
});
