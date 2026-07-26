/** Generic inline container — basic HTML element (plan v7 F9, batch D). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const span = defineComponent({
  name: "span",
  description: "Generic inline container",
  category: "html",

  props: {
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },

  content: { allowed: true, description: "Inner content." },
});
