/** Small print / de-emphasized text — basic HTML element (plan v7 F9, batch D). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const small = defineComponent({
  name: "small",
  description: "Small print / de-emphasized text",
  category: "html",
  system: true,

  props: {
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },

  content: { allowed: true, description: "Inner content." },
});
