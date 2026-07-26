/** Inline code — basic HTML element (plan v7 F9, batch D). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const code = defineComponent({
  name: "code",
  description: "Inline code",
  category: "html",

  props: {
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },

  content: { allowed: true, description: "Inner content." },
});
